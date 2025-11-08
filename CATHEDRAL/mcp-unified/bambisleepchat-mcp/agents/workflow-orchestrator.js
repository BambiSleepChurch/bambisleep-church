// 🦋 WorkflowOrchestrator - Manages complex multi-step moderation workflows
// Uses memory and filesystem MCP servers for queue and state management

const BaseAgent = require("./base-agent");
const EventEmitter = require("events");

/**
 * WorkflowOrchestrator - Coordinate complex moderation workflows
 *
 * Features:
 * - Queue management for batch operations
 * - Multi-step workflow execution
 * - Error recovery and retry logic
 * - Rollback support
 * - Progress tracking
 *
 * @extends BaseAgent
 */
class WorkflowOrchestrator extends BaseAgent {
  constructor(config = {}) {
    const defaultConfig = {
      mcpServers: ["memory", "filesystem"],
      priority: "medium",
      queue: {
        maxSize: 1000,
        processingRate: 10, // items per second
        retryAttempts: 3,
        retryDelay: 5000,
      },
    };

    super("workflow-orchestrator", { ...defaultConfig, ...config });

    this.queue = [];
    this.processing = false;
    this.workflows = new Map();
    this.history = [];
  }

  /**
   * Register a workflow
   *
   * @param {string} name - Workflow name
   * @param {function} handler - Workflow handler function
   * @param {object} options - Workflow options
   */
  registerWorkflow(name, handler, options = {}) {
    this.workflows.set(name, {
      name,
      handler,
      options,
      executions: 0,
      successes: 0,
      failures: 0,
    });

    this.log("INFO", `🦋 Registered workflow: ${name}`);
  }

  /**
   * Queue a workflow for execution
   *
   * @param {string} workflowName - Name of registered workflow
   * @param {object} data - Workflow input data
   * @returns {string} - Task ID
   */
  queueWorkflow(workflowName, data) {
    if (!this.workflows.has(workflowName)) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    if (this.queue.length >= this.config.queue.maxSize) {
      throw new Error("Queue is full");
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task = {
      id: taskId,
      workflowName,
      data,
      status: "queued",
      createdAt: new Date().toISOString(),
      attempts: 0,
      error: null,
    };

    this.queue.push(task);
    this.log("INFO", `🌸 Queued workflow: ${workflowName} (${taskId})`);

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return taskId;
  }

  /**
   * Start processing queue
   */
  async startProcessing() {
    if (this.processing) return;

    this.processing = true;
    this.log("INFO", "✨ Starting queue processing");

    while (this.queue.length > 0) {
      const task = this.queue.shift();

      try {
        await this.executeTask(task);
      } catch (error) {
        this.log("ERROR", `🔥 Task failed: ${task.id} - ${error.message}`);

        // Retry logic
        if (task.attempts < this.config.queue.retryAttempts) {
          task.attempts++;
          task.status = "retry";
          this.queue.push(task);
          this.log("INFO", `🔄 Retrying task: ${task.id} (attempt ${task.attempts})`);

          // Exponential backoff
          await this.sleep(this.config.queue.retryDelay * task.attempts);
        } else {
          task.status = "failed";
          task.error = error.message;
          this.history.push(task);
        }
      }

      // Rate limiting
      await this.sleep(1000 / this.config.queue.processingRate);
    }

    this.processing = false;
    this.log("INFO", "💎 Queue processing complete");
  }

  /**
   * Execute a single task
   */
  async executeTask(task) {
    this.log("INFO", `🦋 Executing task: ${task.id}`);
    task.status = "processing";
    task.startedAt = new Date().toISOString();

    const workflow = this.workflows.get(task.workflowName);
    workflow.executions++;

    try {
      // Execute workflow handler
      const result = await workflow.handler(task.data, this);

      task.status = "completed";
      task.completedAt = new Date().toISOString();
      task.result = result;

      workflow.successes++;
      this.history.push(task);

      this.log("INFO", `✅ Task completed: ${task.id}`);
      this.emit("task:completed", task);

      // Store in memory for analytics
      await this.storeTaskHistory(task);

      return result;
    } catch (error) {
      workflow.failures++;
      throw error;
    }
  }

  /**
   * Store task history in memory MCP server
   */
  async storeTaskHistory(task) {
    try {
      await this.callMcp("memory", {
        action: "store",
        key: `task_${task.id}`,
        data: {
          workflow: task.workflowName,
          status: task.status,
          duration: new Date(task.completedAt) - new Date(task.startedAt),
          timestamp: task.completedAt,
        },
        context: "workflow_history",
      });
    } catch (error) {
      this.log("WARN", `⚠️ Failed to store task history: ${error.message}`);
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    // Check queue
    const queuedTask = this.queue.find((t) => t.id === taskId);
    if (queuedTask) return queuedTask;

    // Check history
    const historicalTask = this.history.find((t) => t.id === taskId);
    return historicalTask || null;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      totalProcessed: this.history.length,
      workflows: Array.from(this.workflows.values()).map((w) => ({
        name: w.name,
        executions: w.executions,
        successes: w.successes,
        failures: w.failures,
        successRate: w.executions > 0 ? w.successes / w.executions : 0,
      })),
    };
  }

  /**
   * Cancel queued task
   */
  cancelTask(taskId) {
    const index = this.queue.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = this.queue.splice(index, 1)[0];
      task.status = "cancelled";
      this.history.push(task);
      this.log("INFO", `❌ Cancelled task: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear queue
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue.forEach((task) => {
      task.status = "cancelled";
      this.history.push(task);
    });
    this.queue = [];
    this.log("INFO", `🧹 Cleared queue: ${count} tasks cancelled`);
  }

  /**
   * Batch workflow - process multiple items
   *
   * @param {string} workflowName - Workflow to execute for each item
   * @param {array} items - Array of items to process
   * @param {object} options - Batch options
   */
  async batchProcess(workflowName, items, options = {}) {
    const batchSize = options.batchSize || 50;
    const parallel = options.parallel || 5;

    this.log("INFO", `🦋 Starting batch process: ${items.length} items, ${parallel} parallel`);

    const results = [];
    const failures = [];

    // Process in chunks
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);

      // Process chunk with parallelism
      const chunkPromises = chunk.map((item) => this.queueWorkflow(workflowName, item));

      const taskIds = await Promise.all(chunkPromises);

      // Wait for chunk to complete
      await this.waitForTasks(taskIds);

      this.log("INFO", `💎 Processed chunk: ${i + chunk.length}/${items.length}`);
    }

    this.log("INFO", `✨ Batch complete: ${results.length} successes, ${failures.length} failures`);

    return { results, failures };
  }

  /**
   * Wait for tasks to complete
   */
  async waitForTasks(taskIds) {
    while (true) {
      const allComplete = taskIds.every((id) => {
        const task = this.getTaskStatus(id);
        return task && (task.status === "completed" || task.status === "failed");
      });

      if (allComplete) break;
      await this.sleep(1000);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = WorkflowOrchestrator;
