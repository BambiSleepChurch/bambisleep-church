/**
 * BambiSleep™ Church MCP Control Tower
 * Memory Graph Visualization Component (D3.js Force-Directed Graph)
 */

/**
 * Render the memory graph visualization container
 */
export function renderMemoryGraph() {
  return `
    <div class="memory-graph-container">
      <div class="graph-toolbar">
        <button class="btn btn-small btn-primary" onclick="window.MemoryGraph.loadGraph()">
          🔄 Load Graph
        </button>
        <button class="btn btn-small btn-outline" onclick="window.MemoryGraph.zoomIn()">
          ➕ Zoom In
        </button>
        <button class="btn btn-small btn-outline" onclick="window.MemoryGraph.zoomOut()">
          ➖ Zoom Out
        </button>
        <button class="btn btn-small btn-outline" onclick="window.MemoryGraph.resetZoom()">
          🎯 Reset
        </button>
        <button class="btn btn-small btn-outline" onclick="window.MemoryGraph.togglePhysics()">
          ⚡ Physics
        </button>
        <span class="graph-stats" id="graph-stats">Nodes: 0 | Relations: 0</span>
      </div>
      <div class="graph-canvas-wrapper">
        <svg id="memory-graph-svg" class="graph-svg"></svg>
      </div>
      <div class="graph-legend">
        <div class="legend-item"><span class="legend-dot entity-person"></span> Person</div>
        <div class="legend-item"><span class="legend-dot entity-concept"></span> Concept</div>
        <div class="legend-item"><span class="legend-dot entity-event"></span> Event</div>
        <div class="legend-item"><span class="legend-dot entity-default"></span> Other</div>
      </div>
      <div id="node-tooltip" class="node-tooltip hidden"></div>
    </div>
  `;
}

/**
 * Memory Graph Controller Class
 */
export class MemoryGraphController {
  constructor(containerId = 'memory-graph-svg') {
    this.containerId = containerId;
    this.svg = null;
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.zoom = null;
    this.physicsEnabled = true;
    this.selectedNode = null;
    
    // Color scheme for entity types
    this.colors = {
      person: '#ff6b9d',
      concept: '#6bffb8',
      event: '#6bb8ff',
      agent: '#ffb86b',
      default: '#b86bff',
    };
  }

  /**
   * Initialize the graph visualization
   */
  async init() {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
      await this.loadD3();
    }

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Graph container not found');
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Clear existing content
    container.innerHTML = '';

    // Create SVG
    this.svg = d3.select(`#${this.containerId}`)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.svg.select('.graph-container').attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create main container group
    this.svg.append('g').attr('class', 'graph-container');

    // Add arrow marker for directed edges
    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#666')
      .style('stroke', 'none');

    // Initialize force simulation
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    console.log('Memory graph initialized');
  }

  /**
   * Load D3.js dynamically
   */
  async loadD3() {
    return new Promise((resolve, reject) => {
      if (typeof d3 !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://d3js.org/d3.v7.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Load graph data from API
   */
  async loadGraph() {
    try {
      const response = await fetch('/api/memory');
      const data = await response.json();

      // Transform data for D3
      this.nodes = (data.entities || []).map(e => ({
        id: e.name,
        type: e.entityType?.toLowerCase() || 'default',
        observations: e.observations || [],
      }));

      this.links = (data.relations || []).map(r => ({
        source: r.from,
        target: r.to,
        type: r.relationType,
      }));

      // Filter out links with missing nodes
      const nodeIds = new Set(this.nodes.map(n => n.id));
      this.links = this.links.filter(l => 
        nodeIds.has(l.source) && nodeIds.has(l.target)
      );

      // Update stats
      this.updateStats();

      // Render the graph
      this.render();

      console.log(`Loaded ${this.nodes.length} nodes and ${this.links.length} relations`);
    } catch (error) {
      console.error('Failed to load graph:', error);
      this.showError('Failed to load knowledge graph');
    }
  }

  /**
   * Render the graph
   */
  render() {
    if (!this.svg) {
      console.error('SVG not initialized');
      return;
    }

    const container = this.svg.select('.graph-container');

    // Clear existing elements
    container.selectAll('*').remove();

    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Create link labels
    const linkLabel = container.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(this.links)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#999')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(this.drag())
      .on('click', (event, d) => this.selectNode(d))
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Add circles to nodes
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => this.colors[d.type] || this.colors.default)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .attr('dx', 16)
      .attr('dy', 4)
      .attr('font-size', '12px')
      .attr('fill', '#e0e0e0')
      .text(d => d.id.length > 20 ? d.id.substring(0, 17) + '...' : d.id);

    // Update simulation
    this.simulation
      .nodes(this.nodes)
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        linkLabel
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    this.simulation.force('link').links(this.links);
    this.simulation.alpha(1).restart();
  }

  /**
   * Create drag behavior
   */
  drag() {
    const simulation = this.simulation;

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  /**
   * Show tooltip for node
   */
  showTooltip(event, d) {
    const tooltip = document.getElementById('node-tooltip');
    if (!tooltip) return;

    const observations = d.observations.length > 0 
      ? d.observations.slice(0, 3).join('<br>')
      : 'No observations';

    tooltip.innerHTML = `
      <strong>${d.id}</strong><br>
      <em>Type: ${d.type}</em><br>
      <hr style="margin: 4px 0; border-color: rgba(255,255,255,0.2)">
      ${observations}
      ${d.observations.length > 3 ? `<br><em>+${d.observations.length - 3} more...</em>` : ''}
    `;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.classList.remove('hidden');
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('node-tooltip');
    if (tooltip) {
      tooltip.classList.add('hidden');
    }
  }

  /**
   * Select a node
   */
  selectNode(d) {
    this.selectedNode = d;
    console.log('Selected node:', d);

    // Highlight selected node
    this.svg.selectAll('.node circle')
      .attr('stroke-width', node => node.id === d.id ? 4 : 2)
      .attr('stroke', node => node.id === d.id ? '#fff' : '#fff');

    // Emit custom event
    window.dispatchEvent(new CustomEvent('memoryNodeSelected', { detail: d }));
  }

  /**
   * Update stats display
   */
  updateStats() {
    const statsEl = document.getElementById('graph-stats');
    if (statsEl) {
      statsEl.textContent = `Nodes: ${this.nodes.length} | Relations: ${this.links.length}`;
    }
  }

  /**
   * Zoom controls
   */
  zoomIn() {
    this.svg.transition().call(this.zoom.scaleBy, 1.5);
  }

  zoomOut() {
    this.svg.transition().call(this.zoom.scaleBy, 0.67);
  }

  resetZoom() {
    this.svg.transition().call(this.zoom.transform, d3.zoomIdentity);
  }

  /**
   * Toggle physics simulation
   */
  togglePhysics() {
    this.physicsEnabled = !this.physicsEnabled;
    if (this.physicsEnabled) {
      this.simulation.alpha(0.3).restart();
    } else {
      this.simulation.stop();
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const container = this.svg?.select('.graph-container');
    if (container) {
      container.append('text')
        .attr('x', 400)
        .attr('y', 300)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff6b6b')
        .attr('font-size', '16px')
        .text(message);
    }
  }

  /**
   * Add entity to graph
   */
  addEntity(entity) {
    const node = {
      id: entity.name,
      type: entity.entityType?.toLowerCase() || 'default',
      observations: entity.observations || [],
    };

    // Check if already exists
    if (!this.nodes.find(n => n.id === node.id)) {
      this.nodes.push(node);
      this.updateStats();
      this.render();
    }
  }

  /**
   * Add relation to graph
   */
  addRelation(relation) {
    const link = {
      source: relation.from,
      target: relation.to,
      type: relation.relationType,
    };

    // Check if nodes exist
    const nodeIds = new Set(this.nodes.map(n => n.id));
    if (nodeIds.has(link.source) && nodeIds.has(link.target)) {
      this.links.push(link);
      this.updateStats();
      this.render();
    }
  }

  /**
   * Remove entity from graph
   */
  removeEntity(name) {
    this.nodes = this.nodes.filter(n => n.id !== name);
    this.links = this.links.filter(l => l.source.id !== name && l.target.id !== name);
    this.updateStats();
    this.render();
  }

  /**
   * Search and highlight nodes
   */
  search(query) {
    if (!query) {
      // Reset all nodes
      this.svg.selectAll('.node circle')
        .attr('opacity', 1)
        .attr('stroke-width', 2);
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.svg.selectAll('.node circle')
      .attr('opacity', d => 
        d.id.toLowerCase().includes(lowerQuery) || 
        d.observations.some(o => o.toLowerCase().includes(lowerQuery))
          ? 1 : 0.3
      )
      .attr('stroke-width', d =>
        d.id.toLowerCase().includes(lowerQuery) ? 4 : 2
      );
  }

  /**
   * Export graph as SVG
   */
  exportSvg() {
    const svgElement = document.getElementById(this.containerId);
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'memory-graph.svg';
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Destroy the graph
   */
  destroy() {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
    this.nodes = [];
    this.links = [];
  }
}

// Global instance
let graphInstance = null;

/**
 * Initialize and return singleton graph controller
 */
export function getMemoryGraph() {
  if (!graphInstance) {
    graphInstance = new MemoryGraphController();
  }
  return graphInstance;
}

// Expose to window for inline handlers
if (typeof window !== 'undefined') {
  window.MemoryGraph = {
    async init() {
      const graph = getMemoryGraph();
      await graph.init();
      return graph;
    },
    async loadGraph() {
      const graph = getMemoryGraph();
      if (!graph.svg) await graph.init();
      await graph.loadGraph();
    },
    zoomIn: () => getMemoryGraph().zoomIn(),
    zoomOut: () => getMemoryGraph().zoomOut(),
    resetZoom: () => getMemoryGraph().resetZoom(),
    togglePhysics: () => getMemoryGraph().togglePhysics(),
    search: (q) => getMemoryGraph().search(q),
    exportSvg: () => getMemoryGraph().exportSvg(),
  };
}

export default { renderMemoryGraph, MemoryGraphController, getMemoryGraph };
