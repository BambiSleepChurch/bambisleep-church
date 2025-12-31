# 🤖 LM Studio MCP Reference

> **Local AI Inference with OpenAI-Compatible API**

This document provides comprehensive documentation for the LM Studio integration in the BambiSleep™ Church MCP Control Tower. LM Studio provides local AI inference with an OpenAI-compatible API, enabling privacy-preserving, offline AI capabilities.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Configuration](#configuration)
4. [API Reference](#api-reference)
5. [Model Recommendations](#model-recommendations)
6. [Code Examples](#code-examples)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is LM Studio?

[LM Studio](https://lmstudio.ai) is a desktop application that allows you to run large language models locally on your machine. It provides:

- **OpenAI-Compatible API** - Drop-in replacement for OpenAI API
- **Local Inference** - No data sent to cloud services
- **Tool Calling Support** - Native function calling for Qwen2.5, Llama-3.1, Mistral
- **Multiple Model Formats** - GGUF, GGML, and more
- **GPU Acceleration** - CUDA, Metal, ROCm support

### Why LM Studio in the Control Tower?

- **Privacy** - All inference happens locally, no API keys required
- **Cost** - No per-token pricing, unlimited usage
- **Speed** - Low latency with local hardware
- **Offline** - Works without internet connection
- **Flexibility** - Easy model switching and experimentation

---

## ⚙️ Setup & Installation

### Step 1: Install LM Studio

1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Install for your platform (Windows, macOS, Linux)
3. Launch LM Studio

### Step 2: Download a Model

Recommended models with native tool-calling support:

| Model | Size | Download | Best For |
|-------|------|----------|----------|
| **qwen2.5-7b-instruct** | 7B | Search "qwen2.5" in LM Studio | General chat + tools |
| **qwen2.5-coder-7b-instruct** | 7B | Search "qwen2.5-coder" | Code generation + tools |
| **llama-3.1-8b-instruct** | 8B | Search "llama-3.1" | Enhanced reasoning |
| **mistral-7b-instruct-v0.3** | 7B | Search "mistral" | Fast inference |

**Download Steps:**
1. Open LM Studio
2. Click "Search" tab
3. Search for model name (e.g., "qwen2.5")
4. Click download on preferred quantization (Q4_K_M recommended for balance)
5. Wait for download to complete

### Step 3: Load the Model

1. Click "Chat" tab in LM Studio
2. Select your downloaded model from dropdown
3. Click "Load Model"
4. Wait for model to load into memory

### Step 4: Start the API Server

1. Click "Local Server" tab in LM Studio
2. Click "Start Server"
3. Server will start on `http://localhost:1234` by default
4. Keep LM Studio running while using the Control Tower

### Step 5: Configure Control Tower

Add to your `.env` file:

```bash
LMS_HOST=localhost
LMS_PORT=1234
LMS_MODEL=qwen2.5-7b-instruct
LMS_TEMPERATURE=0.7
LMS_MAX_TOKENS=2048
LMS_TIMEOUT=60000
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LMS_HOST` | `localhost` | LM Studio server hostname |
| `LMS_PORT` | `1234` | LM Studio server port |
| `LMS_MODEL` | `qwen2.5-7b-instruct` | Default model identifier |
| `LMS_TEMPERATURE` | `0.7` | Sampling temperature (0.0-2.0) |
| `LMS_MAX_TOKENS` | `2048` | Max tokens to generate |
| `LMS_TIMEOUT` | `60000` | Request timeout in milliseconds |

### Server Configuration in LM Studio

**Advanced Settings:**
- **Context Length**: Set to model's max (usually 4096-8192)
- **GPU Layers**: Increase for faster inference (if you have GPU)
- **Thread Count**: Set to number of CPU cores
- **Batch Size**: Increase for throughput (decrease for lower memory)

**CORS Settings:**
- Enable CORS in LM Studio server settings
- Add Control Tower URL to allowed origins

---

## 📡 API Reference

### Health Check

**Endpoint:** `GET /api/lmstudio/health`

Test connection to LM Studio server.

**Response:**
```json
{
  "status": "ok",
  "server": "http://localhost:1234",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to connect to LM Studio server",
  "server": "http://localhost:1234"
}
```

---

### List Models

**Endpoint:** `GET /api/lmstudio/models`

Get list of available models in LM Studio.

**Response:**
```json
{
  "data": [
    {
      "id": "qwen2.5-7b-instruct",
      "object": "model",
      "created": 1234567890,
      "owned_by": "lmstudio"
    }
  ],
  "object": "list"
}
```

---

### Get Loaded Model

**Endpoint:** `GET /api/lmstudio/model/loaded`

Get currently loaded model information.

**Response:**
```json
{
  "id": "qwen2.5-7b-instruct",
  "object": "model",
  "created": 1234567890,
  "owned_by": "lmstudio"
}
```

---

### Chat Completion

**Endpoint:** `POST /api/lmstudio/chat`

Generate chat completions using the loaded model.

**Request:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello! How are you?"}
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 100,
    "stream": false
  }
}
```

**Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen2.5-7b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 20,
    "total_tokens": 45
  }
}
```

---

### Chat with Tool Calling

**Endpoint:** `POST /api/lmstudio/chat/tools`

Chat with function/tool calling support.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "What's the weather in San Francisco?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "options": {
    "temperature": 0.7
  }
}
```

**Response (Tool Call):**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen2.5-7b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\":\"San Francisco\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

**Follow-up Request (After Tool Execution):**
```json
{
  "messages": [
    {"role": "user", "content": "What's the weather in San Francisco?"},
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_123",
          "type": "function",
          "function": {
            "name": "get_weather",
            "arguments": "{\"location\":\"San Francisco\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_123",
      "content": "{\"temperature\": 72, \"condition\": \"sunny\"}"
    }
  ],
  "tools": [...],
  "options": {...}
}
```

**Final Response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The weather in San Francisco is currently sunny with a temperature of 72°F."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

### Text Completion

**Endpoint:** `POST /api/lmstudio/complete`

Legacy completion API for text generation.

**Request:**
```json
{
  "prompt": "Once upon a time, in a land far away,",
  "options": {
    "max_tokens": 100,
    "temperature": 0.8,
    "stop": ["\n\n"]
  }
}
```

**Response:**
```json
{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "created": 1234567890,
  "model": "qwen2.5-7b-instruct",
  "choices": [
    {
      "text": " there lived a brave knight who sought to...",
      "index": 0,
      "finish_reason": "stop"
    }
  ]
}
```

---

### Generate Embeddings

**Endpoint:** `POST /api/lmstudio/embed`

Generate text embeddings for semantic search.

**Request:**
```json
{
  "input": "BambiSleep is a hypnosis series",
  "options": {
    "model": "nomic-embed-text"
  }
}
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.123, -0.456, 0.789, ...],
      "index": 0
    }
  ],
  "model": "nomic-embed-text",
  "usage": {
    "prompt_tokens": 7,
    "total_tokens": 7
  }
}
```

---

## 🎯 Model Recommendations

### For Agent Tool Calling (Recommended)

**Qwen2.5-7B-Instruct**
- **Size**: 7B parameters (~4-5GB with Q4 quantization)
- **Strengths**: Excellent tool calling, fast inference, multilingual
- **Best Quantization**: `Q4_K_M` or `Q5_K_M`
- **VRAM Required**: 6-8GB GPU or 16GB+ RAM

**Qwen2.5-Coder-7B-Instruct**
- **Size**: 7B parameters
- **Strengths**: Code generation, technical tasks, tool calling
- **Best Quantization**: `Q4_K_M`
- **VRAM Required**: 6-8GB GPU or 16GB+ RAM

### For Enhanced Reasoning

**Llama-3.1-8B-Instruct**
- **Size**: 8B parameters (~5-6GB with Q4 quantization)
- **Strengths**: Strong reasoning, good tool calling, accurate
- **Best Quantization**: `Q4_K_M`
- **VRAM Required**: 8-10GB GPU or 20GB+ RAM

**Mistral-7B-Instruct-v0.3**
- **Size**: 7B parameters
- **Strengths**: Fast, efficient, good tool support
- **Best Quantization**: `Q4_K_M`
- **VRAM Required**: 6-8GB GPU or 16GB+ RAM

### For Constrained Resources

**Phi-3-Mini-4K-Instruct**
- **Size**: 3.8B parameters (~2-3GB with Q4 quantization)
- **Strengths**: Very compact, surprisingly capable
- **Limitations**: Limited tool calling support
- **Best Quantization**: `Q4_K_M`
- **VRAM Required**: 4GB GPU or 8GB+ RAM

### Quantization Guide

| Quantization | Size | Quality | Speed | Recommendation |
|--------------|------|---------|-------|----------------|
| `Q2_K` | Smallest | Low | Fastest | ❌ Not recommended |
| `Q3_K_M` | Small | Medium-Low | Fast | ⚠️ Budget systems only |
| `Q4_K_M` | Medium | Good | Fast | ✅ **Recommended** |
| `Q5_K_M` | Large | Better | Medium | ✅ If you have VRAM |
| `Q6_K` | Larger | Best | Slower | ⚠️ Diminishing returns |
| `Q8_0` | Largest | Excellent | Slowest | ❌ Too slow for agent use |

---

## 💻 Code Examples

### Using the LM Studio Client Directly

```javascript
import { getLmStudioClient } from './servers/lmstudio.js';

// Get singleton client instance
const lms = getLmStudioClient();

// Test connection
const health = await lms.testConnection();
console.log('LM Studio status:', health.status);

// List available models
const models = await lms.listModels();
console.log('Available models:', models.data);

// Simple chat
const response = await lms.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' }
]);
console.log(response.choices[0].message.content);

// Chat with tool calling
const toolResponse = await lms.chatWithTools(
  [{ role: 'user', content: 'Search for bambisleep hypnosis' }],
  [
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      }
    }
  ]
);

if (toolResponse.choices[0].message.tool_calls) {
  console.log('Tool calls:', toolResponse.choices[0].message.tool_calls);
}
```

### Integration with Agent Orchestrator

```javascript
import { agentHandlers } from './servers/agent.js';

// Create conversation
const conversation = agentHandlers.createConversation();
console.log('Conversation ID:', conversation.id);

// Send message (agent will use LM Studio)
const response = await agentHandlers.chat(conversation.id, 
  'Search GitHub for bambisleep repositories'
);
console.log('Agent response:', response.message);

// Check tool usage stats
const stats = agentHandlers.getStats();
console.log('Total tool calls:', stats.totalToolCalls);
console.log('Tool usage:', stats.toolUsage);
```

### Custom HTTP Client

```javascript
// Direct HTTP request to LM Studio via Control Tower
const response = await fetch('http://localhost:8080/api/lmstudio/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    options: {
      temperature: 0.7,
      max_tokens: 100
    }
  })
});

const result = await response.json();
console.log(result.choices[0].message.content);
```

---

## 🔧 Troubleshooting

### Connection Issues

**Problem:** `Failed to connect to LM Studio server`

**Solutions:**
1. Verify LM Studio is running
2. Check server is started in "Local Server" tab
3. Verify port in `.env` matches LM Studio (default: 1234)
4. Check firewall isn't blocking localhost:1234
5. Try restarting LM Studio

### Model Loading Issues

**Problem:** Model fails to load or crashes

**Solutions:**
1. Check you have enough RAM/VRAM
2. Try a smaller quantization (Q4_K_M → Q3_K_M)
3. Close other applications to free memory
4. Reduce GPU layers in LM Studio settings
5. Try a smaller model (7B → 3.8B)

### Slow Inference

**Problem:** Responses are very slow

**Solutions:**
1. Increase GPU layers in LM Studio (if you have GPU)
2. Use a smaller quantization (Q5_K_M → Q4_K_M)
3. Reduce context length in settings
4. Try a smaller model
5. Close background applications

### Tool Calling Not Working

**Problem:** Model doesn't recognize tools

**Solutions:**
1. Verify you're using a tool-compatible model:
   - ✅ Qwen2.5 (any size)
   - ✅ Llama-3.1 (8B+)
   - ✅ Mistral (7B+)
   - ❌ Older models may not support tools
2. Check tool schema is valid OpenAI format
3. Update LM Studio to latest version
4. Try with example tool from docs

### API Errors

**Problem:** Getting 400/500 errors from API

**Solutions:**
1. Check request body is valid JSON
2. Verify `messages` array format (role + content)
3. Check model name matches loaded model
4. Look at Control Tower logs: `npm run dev`
5. Test directly in LM Studio UI first

### Performance Optimization

**Best Practices:**
1. Use Q4_K_M quantization (balance of speed/quality)
2. Set context length to minimum needed (saves memory)
3. Enable GPU acceleration if available
4. Use 7B models for agent tasks (sweet spot)
5. Monitor VRAM/RAM usage, adjust accordingly

---

## 📊 Performance Benchmarks

### Inference Speed (Q4_K_M quantization)

| Model | Hardware | Tokens/sec | Latency (first token) |
|-------|----------|------------|-----------------------|
| Qwen2.5-7B | RTX 4090 (24GB) | ~120 t/s | ~50ms |
| Qwen2.5-7B | M2 Max (32GB) | ~80 t/s | ~100ms |
| Qwen2.5-7B | CPU (i9-13900K) | ~15 t/s | ~300ms |
| Llama-3.1-8B | RTX 4090 (24GB) | ~100 t/s | ~60ms |
| Phi-3-Mini | RTX 4090 (24GB) | ~180 t/s | ~30ms |

*Benchmarks are approximate and vary by system configuration*

### Memory Requirements

| Model | Q4_K_M Size | Minimum RAM | Recommended RAM | GPU VRAM |
|-------|-------------|-------------|-----------------|----------|
| Phi-3-Mini (3.8B) | ~2.5GB | 8GB | 16GB | 4GB |
| Qwen2.5-7B | ~4.5GB | 16GB | 32GB | 6-8GB |
| Llama-3.1-8B | ~5.5GB | 16GB | 32GB | 8-10GB |
| Qwen2.5-14B | ~9GB | 32GB | 64GB | 12-16GB |

---

## 🔗 Additional Resources

- [LM Studio Official Docs](https://lmstudio.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Qwen2.5 Model Card](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct)
- [Llama-3.1 Documentation](https://llama.meta.com)
- [GGUF Format Specification](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)

---

## 🌸 License

MIT License - See [LICENSE](../LICENSE) for details.

---

✨ _Local AI inference for the digital sanctuary_ ✨

**BambiSleepChurch™** | [GitHub](https://github.com/BambiSleepChurch) | [bambisleep.info](https://bambisleep.info/)
