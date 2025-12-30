# 🌸 HuggingFace MCP Reference

> **BambiSleep™ Church MCP Control Tower**  
> Integration reference for Hugging Face ML platform

---

## Overview

Hugging Face provides access to 100,000+ machine learning models via:

- **Inference Providers** - Serverless inference powered by multiple providers
- **Inference Endpoints** - Dedicated, autoscaling infrastructure
- **Hub API** - Repository management for models, datasets, and spaces
- **MCP Client** - Model Context Protocol integration

---

## NPM Packages

```bash
# Core packages
npm install @huggingface/inference   # ML model inference
npm install @huggingface/hub         # Repository management
npm install @huggingface/mcp-client  # MCP agent integration

# Utility packages
npm install @huggingface/gguf        # GGUF model parser
npm install @huggingface/jinja       # Chat template engine
npm install @huggingface/transformers # Browser/Node ML models
```

---

## Authentication

Get your access token from https://huggingface.co/settings/tokens

```javascript
// Environment variable
const HF_TOKEN = process.env.HF_ACCESS_TOKEN;

// Or direct assignment
const HF_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
```

---

## @huggingface/inference

### Installation & Setup

```javascript
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_ACCESS_TOKEN);
```

### Chat Completion

```javascript
// Standard chat completion
const response = await client.chatCompletion({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, nice to meet you!" },
  ],
  max_tokens: 512,
  temperature: 0.7,
});

console.log(response.choices[0].message);
```

### Streaming Chat Completion

```javascript
for await (const chunk of client.chatCompletionStream({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [{ role: "user", content: "Tell me a story" }],
  max_tokens: 512,
})) {
  process.stdout.write(chunk.choices[0].delta.content || "");
}
```

### Using Third-Party Providers

```javascript
// Supported providers: sambanova, together, fal-ai, replicate, cohere
await client.chatCompletion({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [{ role: "user", content: "Hello!" }],
  max_tokens: 512,
  provider: "sambanova",
});
```

### Text Generation

```javascript
const result = await client.textGeneration({
  model: "gpt2",
  inputs: "The answer to the universe is",
  parameters: {
    max_new_tokens: 50,
    temperature: 0.8,
  },
});

console.log(result.generated_text);
```

### Text-to-Image

```javascript
const imageBlob = await client.textToImage({
  model: "black-forest-labs/FLUX.1-dev",
  inputs: "a mystical forest with glowing mushrooms",
  provider: "fal-ai",
});

// Save or process the image blob
```

### Image-to-Text (Captioning)

```javascript
const imageResponse = await fetch("https://example.com/image.jpg");
const imageBlob = await imageResponse.blob();

const result = await client.imageToText({
  model: "nlpconnect/vit-gpt2-image-captioning",
  data: imageBlob,
});

console.log(result.generated_text);
```

### Translation

```javascript
const result = await client.translation({
  model: "Helsinki-NLP/opus-mt-en-fr",
  inputs: "My name is Wolfgang and I live in Amsterdam",
  parameters: {
    src_lang: "en",
    tgt_lang: "fr",
  },
});

console.log(result.translation_text);
```

### Question Answering

```javascript
const result = await client.questionAnswering({
  model: "deepset/roberta-base-squad2",
  inputs: {
    question: "Where is Hugging Face headquarters?",
    context: "Hugging Face is based in Brooklyn, New York.",
  },
});

console.log(result.answer); // "Brooklyn, New York"
```

### Fill Mask

```javascript
const result = await client.fillMask({
  model: "bert-base-uncased",
  inputs: "The goal of life is [MASK].",
});

console.log(result[0].sequence);
```

### Text Classification / Sentiment

```javascript
const result = await client.textClassification({
  model: "distilbert-base-uncased-finetuned-sst-2-english",
  inputs: "I love this product!",
});

console.log(result[0].label); // "POSITIVE"
```

### Embeddings

```javascript
const result = await client.featureExtraction({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  inputs: "This is a sample sentence.",
});

console.log(result); // [0.123, -0.456, ...]
```

### Using Dedicated Inference Endpoints

```javascript
// Connect to your deployed endpoint
const endpoint = client.endpoint(
  "https://xyz.eu-west-1.aws.endpoints.huggingface.cloud/my-model"
);

const result = await endpoint.textGeneration({
  inputs: "Hello, world!",
});

// Chat endpoint
const llamaEndpoint = client.endpoint(
  "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct"
);

const chat = await llamaEndpoint.chatCompletion({
  messages: [{ role: "user", content: "Hello!" }],
  max_tokens: 512,
});
```

---

## @huggingface/hub

### Repository Management

```javascript
import {
  createRepo,
  deleteRepo,
  uploadFile,
  deleteFiles,
  listFiles,
  downloadFile,
  commit,
} from "@huggingface/hub";

const HF_TOKEN = process.env.HF_ACCESS_TOKEN;
```

### Create Repository

```javascript
// Create a model repository
await createRepo({
  repo: "my-user/my-model",
  accessToken: HF_TOKEN,
});

// Create with specific type
await createRepo({
  repo: { type: "model", name: "my-user/my-model" },
  accessToken: HF_TOKEN,
  private: true,
});

// Create dataset repository
await createRepo({
  repo: { type: "dataset", name: "my-user/my-dataset" },
  accessToken: HF_TOKEN,
});

// Create space
await createRepo({
  repo: { type: "space", name: "my-user/my-space" },
  accessToken: HF_TOKEN,
  sdk: "gradio", // or "streamlit", "static", "docker"
});
```

### Upload Files

```javascript
// Upload single file
await uploadFile({
  repo: "my-user/my-model",
  accessToken: HF_TOKEN,
  file: {
    path: "model.safetensors",
    content: new Blob([modelBuffer]),
  },
});

// Upload with commit message
await uploadFile({
  repo: "my-user/my-model",
  accessToken: HF_TOKEN,
  file: {
    path: "config.json",
    content: new Blob([JSON.stringify(config)]),
  },
  commitTitle: "Add model config",
});
```

### Delete Files

```javascript
await deleteFiles({
  repo: { type: "model", name: "my-user/my-model" },
  accessToken: HF_TOKEN,
  paths: ["old_model.bin", "deprecated/"],
});
```

### List Files

```javascript
const files = await listFiles({
  repo: "meta-llama/Llama-3.1-8B-Instruct",
});

for await (const file of files) {
  console.log(file.path, file.size);
}
```

### Download Files

```javascript
const response = await downloadFile({
  repo: "my-user/my-model",
  path: "config.json",
});

const content = await response.text();
```

### Commit Multiple Changes

```javascript
await commit({
  repo: "my-user/my-model",
  accessToken: HF_TOKEN,
  title: "Update model files",
  operations: [
    {
      operation: "addOrUpdate",
      path: "README.md",
      content: new Blob(["# My Model"]),
    },
    {
      operation: "addOrUpdate",
      path: "config.json",
      content: new Blob([JSON.stringify(config)]),
    },
    { operation: "delete", path: "old_file.txt" },
  ],
});
```

### Delete Repository

```javascript
await deleteRepo({
  repo: { type: "model", name: "my-user/my-model" },
  accessToken: HF_TOKEN,
});
```

### CLI Usage

```bash
# Upload files via CLI
npx @huggingface/hub upload my-user/my-model ./local-folder

# Upload specific file
npx @huggingface/hub upload my-user/my-model ./model.bin
```

---

## @huggingface/mcp-client

### MCP Agent Setup

```javascript
import { Agent } from "@huggingface/mcp-client";

const agent = new Agent({
  provider: "auto",
  model: "Qwen/Qwen2.5-72B-Instruct",
  apiKey: process.env.HF_ACCESS_TOKEN,
  servers: [
    {
      // Add MCP servers
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  ],
});

// Load available tools
await agent.loadTools();

// Run agent
for await (const chunk of agent.run(
  "What are the trending models on HuggingFace?"
)) {
  if ("choices" in chunk) {
    const delta = chunk.choices[0]?.delta;
    if (delta.content) {
      process.stdout.write(delta.content);
    }
  }
}
```

---

## Inference Endpoints Management

### Create Endpoint

```python
# Python example (huggingface_hub)
from huggingface_hub import create_inference_endpoint

endpoint = create_inference_endpoint(
    name="my-endpoint",
    repository="meta-llama/Llama-3.1-8B-Instruct",
    framework="pytorch",
    task="text-generation",
    accelerator="gpu",
    instance_type="nvidia-l4",
    instance_size="x1",
    region="us-east-1"
)

# Wait for deployment
endpoint.wait()
print(f"Endpoint URL: {endpoint.url}")
```

### Endpoint Lifecycle

```python
from huggingface_hub import get_inference_endpoint

endpoint = get_inference_endpoint("my-endpoint")

# Check status
print(endpoint.status)  # 'running', 'paused', 'pending', etc.

# Pause to save costs
endpoint.pause()

# Resume when needed
endpoint.resume()
endpoint.wait()

# Scale to zero (keeps endpoint, no costs when idle)
endpoint.scale_to_zero()

# Delete endpoint
endpoint.delete()
```

---

## Supported Tasks

| Task                             | Method                         | Example Model                                     |
| -------------------------------- | ------------------------------ | ------------------------------------------------- |
| **Text Generation**              | `textGeneration()`             | `gpt2`                                            |
| **Chat Completion**              | `chatCompletion()`             | `meta-llama/Llama-3.1-8B-Instruct`                |
| **Text-to-Image**                | `textToImage()`                | `black-forest-labs/FLUX.1-dev`                    |
| **Image-to-Text**                | `imageToText()`                | `nlpconnect/vit-gpt2-image-captioning`            |
| **Translation**                  | `translation()`                | `Helsinki-NLP/opus-mt-en-fr`                      |
| **Summarization**                | `summarization()`              | `facebook/bart-large-cnn`                         |
| **Question Answering**           | `questionAnswering()`          | `deepset/roberta-base-squad2`                     |
| **Fill Mask**                    | `fillMask()`                   | `bert-base-uncased`                               |
| **Text Classification**          | `textClassification()`         | `distilbert-base-uncased-finetuned-sst-2-english` |
| **Token Classification**         | `tokenClassification()`        | `dslim/bert-base-NER`                             |
| **Feature Extraction**           | `featureExtraction()`          | `sentence-transformers/all-MiniLM-L6-v2`          |
| **Automatic Speech Recognition** | `automaticSpeechRecognition()` | `openai/whisper-large-v3`                         |
| **Text-to-Speech**               | `textToSpeech()`               | `espnet/kan-bayashi_ljspeech_vits`                |
| **Image Classification**         | `imageClassification()`        | `google/vit-base-patch16-224`                     |
| **Object Detection**             | `objectDetection()`            | `facebook/detr-resnet-50`                         |
| **Image Segmentation**           | `imageSegmentation()`          | `facebook/mask2former-swin-large-coco-instance`   |
| **Zero-Shot Classification**     | `zeroShotClassification()`     | `facebook/bart-large-mnli`                        |

---

## CDN / Browser Usage

```html
<script type="module">
  import { InferenceClient } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@4.13.5/+esm";
  import {
    createRepo,
    uploadFile,
  } from "https://cdn.jsdelivr.net/npm/@huggingface/hub@2.7.1/+esm";

  const client = new InferenceClient("hf_...");

  const result = await client.textGeneration({
    model: "gpt2",
    inputs: "Hello, world!",
  });

  console.log(result);
</script>
```

---

## MCP Server Implementation Notes

### Recommended MCP Tools

| Tool                 | Purpose                      |
| -------------------- | ---------------------------- |
| `hf_chat_completion` | Chat with LLM models         |
| `hf_text_generation` | Generate text completions    |
| `hf_text_to_image`   | Generate images from prompts |
| `hf_image_to_text`   | Caption/describe images      |
| `hf_translation`     | Translate between languages  |
| `hf_summarization`   | Summarize text               |
| `hf_embeddings`      | Generate text embeddings     |
| `hf_model_search`    | Search for models            |
| `hf_dataset_search`  | Search for datasets          |
| `hf_repo_create`     | Create repository            |
| `hf_repo_upload`     | Upload files to repository   |

### Environment Variables

```bash
HF_ACCESS_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HF_INFERENCE_ENDPOINT=https://your-endpoint.huggingface.cloud
HF_DEFAULT_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

### Server Configuration Schema

```javascript
const huggingfaceConfig = {
  accessToken: process.env.HF_ACCESS_TOKEN,
  defaultModel: "meta-llama/Llama-3.1-8B-Instruct",
  defaultProvider: "auto", // or specific provider
  inferenceEndpoint: process.env.HF_INFERENCE_ENDPOINT,
  maxTokens: 2048,
  temperature: 0.7,
  timeout: 60000,
};
```

---

## Error Handling

```javascript
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_ACCESS_TOKEN);

try {
  const result = await client.textGeneration({
    model: "gpt2",
    inputs: "Hello",
  });
} catch (error) {
  if (error.status === 401) {
    console.error("Invalid or expired access token");
  } else if (error.status === 429) {
    console.error("Rate limit exceeded, retry later");
  } else if (error.status === 503) {
    console.error("Model is loading, retry in a few seconds");
  } else {
    console.error("Inference error:", error.message);
  }
}
```

---

## Best Practices

### ✅ Do

- Use environment variables for tokens
- Implement retry logic for 503 (model loading) responses
- Use streaming for long-running generations
- Cache model responses when appropriate
- Use dedicated endpoints for production workloads
- Pause endpoints when not in use to save costs

### ❌ Don't

- Hardcode access tokens in source code
- Ignore rate limits (429 responses)
- Use serverless inference for high-throughput production
- Forget to handle model loading delays
- Leave unused inference endpoints running

---

## Resources

| Resource                | URL                                                   |
| ----------------------- | ----------------------------------------------------- |
| **NPM - Inference**     | https://www.npmjs.com/package/@huggingface/inference  |
| **NPM - Hub**           | https://www.npmjs.com/package/@huggingface/hub        |
| **NPM - MCP Client**    | https://www.npmjs.com/package/@huggingface/mcp-client |
| **Documentation**       | https://huggingface.co/docs/huggingface.js            |
| **Model Hub**           | https://huggingface.co/models                         |
| **Dataset Hub**         | https://huggingface.co/datasets                       |
| **Inference Endpoints** | https://huggingface.co/docs/inference-endpoints       |
| **GitHub**              | https://github.com/huggingface/huggingface.js         |

---

**Organization:** BambiSleepChurch  
**Trademark Notice:** BambiSleep™ is a trademark of BambiSleepChurch
