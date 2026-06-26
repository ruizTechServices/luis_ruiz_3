# CHEAT_SHEET.md — Orin Nano Ollama Docker Endpoint

## Identity

```text
Device: Jetson Orin Nano
Host: orin-nano-44
SSH: giosterr44@100.86.175.53
Container: ollama-gpu
Image: ollama/ollama
Host API: http://100.86.175.53:11435
Internal Ollama API: http://localhost:11434
Main model: qwen3:1.7b
```

## SSH Into Orin

```bash
ssh giosterr44@100.86.175.53
```

## Check Container

```bash
docker ps
```

Expected:

```text
ollama-gpu
0.0.0.0:11435->11434/tcp
```

## Start / Stop / Restart

```bash
docker start ollama-gpu
docker stop ollama-gpu
docker restart ollama-gpu
```

## Logs

```bash
docker logs ollama-gpu --tail=100
docker logs -f ollama-gpu
```

## Docker Stats

```bash
docker stats ollama-gpu
```

## List Models

```bash
docker exec -it ollama-gpu ollama list
```

## Pull Model

```bash
docker exec -it ollama-gpu ollama pull qwen3:1.7b
```

## Run Model Interactively

```bash
docker exec -it ollama-gpu ollama run qwen3:1.7b
```

Exit:

```text
/bye
```

or:

```text
Ctrl + d
```

## Remove Model

```bash
docker exec -it ollama-gpu ollama rm qwen3:1.7b
```

## API Health Check

From Windows Git Bash:

```bash
curl -sS http://100.86.175.53:11435/api/tags | jq
```

## Simple Chat

```bash
curl -sS http://100.86.175.53:11435/api/chat \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model":"qwen3:1.7b",
    "stream":false,
    "messages":[
      {
        "role":"user",
        "content":"Explain what an algorithm is in one paragraph."
      }
    ],
    "options":{
      "temperature":0.2,
      "num_ctx":2048,
      "num_predict":512
    }
  }' | jq -r '.message.content // .error // .'
```

## Thinking Chat

```bash
curl -sS http://100.86.175.53:11435/api/chat \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model":"qwen3:1.7b",
    "think":true,
    "stream":false,
    "messages":[
      {
        "role":"user",
        "content":"Think briefly, then explain recursion simply in one paragraph."
      }
    ],
    "options":{
      "temperature":0.2,
      "num_ctx":2048,
      "num_predict":1024
    }
  }' \
  | jq -r '"THINKING:\n\(.message.thinking // "")\n\nANSWER:\n\(.message.content // "")"'
```

## Streaming Thinking Chat //I think this doesnt work...

```bash
# curl -sS http://100.86.175.53:11435/api/chat \
#   -H "Content-Type: application/json" \
#   --data-raw '{
#     "model":"qwen3:1.7b",
#     "think":true,
#     "stream":true,
#     "messages":[
#       {
#         "role":"user",
#         "content":"Think briefly, then explain recursion simply in one paragraph."
#       }
#     ],
#     "options":{
#       "temperature":0.2,
#       "num_ctx":2048,
#       "num_predict":1024
#     }
#   }' \
#   | jq -r '
#     if .message.thinking then "[thinking] " + .message.thinking
#     elif .message.content then "[answer] " + .message.content
#     else empty end
#   '
```

## Exact Endpoint Test

Use `think:false` for exact tests.

```bash
curl -sS http://100.86.175.53:11435/api/chat \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model":"qwen3:1.7b",
    "think":false,
    "stream":false,
    "messages":[
      {
        "role":"user",
        "content":"Reply with exactly: orin endpoint online"
      }
    ],
    "options":{
      "temperature":0,
      "num_ctx":1024,
      "num_predict":32
    }
  }' \
  | jq -r '.message.content // .error // .'
```

Expected:

```text
orin endpoint online
```

## Debug Response

```bash
curl -sS http://100.86.175.53:11435/api/chat \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model":"qwen3:1.7b",
    "think":true,
    "stream":false,
    "messages":[
      {
        "role":"user",
        "content":"Explain recursion simply."
      }
    ],
    "options":{
      "temperature":0.2,
      "num_ctx":2048,
      "num_predict":512
    }
  }' | jq '{
    thinking:.message.thinking,
    answer:.message.content,
    done:.done,
    done_reason:.done_reason,
    eval_count:.eval_count
  }'
```

## If Answer Is Empty

Check:

```json
"done_reason": "length"
```

If true, increase:

```json
"num_predict": 1024
```

or use:

```text
Think briefly, then answer...
```

## Good Defaults

### Normal Chat

```json
{
  "think": false,
  "stream": false,
  "temperature": 0.2,
  "num_ctx": 2048,
  "num_predict": 512
}
```

### Thinking Chat

```json
{
  "think": true,
  "stream": false,
  "temperature": 0.2,
  "num_ctx": 2048,
  "num_predict": 1024
}
```

### Streaming UI

```json
{
  "think": true,
  "stream": true,
  "temperature": 0.2,
  "num_ctx": 2048,
  "num_predict": 1024
}
```

## Monitor GPU

Run on Orin host:

```bash
jtop
```

## Monitor in tmux

```bash
tmux new -s monitor
jtop
```

Detach:

```text
Ctrl+b
d
```

Reattach:

```bash
tmux attach -t monitor
```

## What to Watch in jtop

Good:

```text
GPU/GR3D rises during generation
llama-server appears as active process
CPU stays relatively low
Swap stays low
Temperature remains stable
```

Bad:

```text
Swap grows above 1GB
RAM gets close to full
GPU stays at 0 during generation
Container restarts
Responses become very slow
```

## Model Size Guidance

```text
qwen3:0.6b   safest
qwen3:1.7b   current best choice
qwen3:4b     test carefully
7B+          probably too heavy
```

## Next.js Rule

Do not call the Orin endpoint directly from public frontend code.

Use:

```text
Browser -> Next.js API Route -> Orin Ollama endpoint
```

## Minimal Next.js Proxy Route

```ts
export async function POST(req: Request) {
  const body = await req.json();

  const ollamaResponse = await fetch("http://100.86.175.53:11435/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3:1.7b",
      think: true,
      stream: false,
      keep_alive: "10m",
      messages: body.messages,
      options: {
        temperature: 0.2,
        num_ctx: 2048,
        num_predict: 1024,
      },
    }),
  });

  const data = await ollamaResponse.json();

  return Response.json({
    thinking: data.message?.thinking ?? "",
    answer: data.message?.content ?? "",
    doneReason: data.done_reason ?? null,
  });
}
```

## Most Common Mistake

Bad:

```json
{
  "think": true,
  "num_predict": 32
}
```

Why bad:

```text
The model may use all 32 tokens thinking and return no final answer.
```

Better:

```json
{
  "think": true,
  "num_predict": 1024
}
```

or:

```json
{
  "think": false,
  "num_predict": 32
}
```

## TL;DR

Use:

```text
POST http://100.86.175.53:11435/api/chat
```

with:

```json
"model": "qwen3:1.7b"
```

For thinking:

```json
"think": true
```

Read:

```text
message.thinking
message.content
```

Keep `num_predict` at `1024` when thinking is enabled.



---
---
---
---
# Jetson Orin Nano — Local AI API Reference

## Server

```text
Base URL: http://100.86.175.53:11435
Runtime:  Ollama GPU Docker container
Container: ollama-gpu
Access:    Private Tailscale network
```

> The `Authorization: Bearer ollama` value satisfies OpenAI SDK clients, but it is not real access control. Keep the server private.

---

## Models

| Capability               | Model                  |
| ------------------------ | ---------------------- |
| Chat and text generation | `qwen3:1.7b`           |
| Text and code embeddings | `qwen3-embedding:0.6b` |

---

## `POST /api/chat`

Native Ollama chat-completion endpoint.

Use this route when working directly with the Ollama API rather than an OpenAI-compatible SDK.

### Request

```bash
curl -sS http://100.86.175.53:11435/api/chat \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model": "qwen3:1.7b",
    "messages": [
      {
        "role": "user",
        "content": "Explain recursion simply."
      }
    ],
    "stream": false
  }' | jq
```

### Important response field

```text
.message.content
```

---

## `POST /v1/chat/completions`

OpenAI-compatible chat-completions endpoint.

Use this route with applications and libraries designed for the OpenAI Chat Completions API.

### Request

```bash
curl -sS http://100.86.175.53:11435/v1/chat/completions \
  -H "Authorization: Bearer ollama" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model": "qwen3:1.7b",
    "messages": [
      {
        "role": "user",
        "content": "Reply with exactly: endpoint online"
      }
    ],
    "temperature": 0,
    "stream": false
  }' | jq
```

### Important response fields

```text
.choices[0].message.content
.choices[0].message.reasoning
.usage.prompt_tokens
.usage.completion_tokens
.usage.total_tokens
```

### Current status

```text
Working
```

---

## `POST /api/embed`

Native Ollama embeddings endpoint.

Converts one string or several strings into numerical vectors for semantic search, RAG, similarity comparison, clustering, and code retrieval.

The native endpoint has been successfully tested with an array containing two inputs.

### Request

```bash
curl -sS http://100.86.175.53:11435/api/embed \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model": "qwen3-embedding:0.6b",
    "input": [
      "Next.js server components run primarily on the server.",
      "React client components can use browser state."
    ]
  }' | jq
```

### Important response field

```text
.embeddings
```

### Response behavior

```text
One input string  → one embedding vector
Multiple strings  → one embedding vector per input
```

---

## `POST /v1/embeddings`

OpenAI-compatible embeddings endpoint.

Use this route with OpenAI-compatible vector, RAG, indexing, or document-processing libraries.

The endpoint has returned a valid OpenAI-style `list` response containing embedding data.

### Request

```bash
curl -sS http://100.86.175.53:11435/v1/embeddings \
  -H "Authorization: Bearer ollama" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model": "qwen3-embedding:0.6b",
    "input": "Create an embedding for this source-code documentation."
  }' | jq
```

### Important response fields

```text
.data[0].embedding
.data[0].index
.model
.usage.prompt_tokens
.usage.total_tokens
```

### Current status

```text
Working
```

---

## `GET /api/tags`

Lists models currently installed in Ollama.

### Request

```bash
curl -sS http://100.86.175.53:11435/api/tags \
  | jq -r '.models[].name'
```

---

## `GET /api/version`

Returns the Ollama server version.

### Request

```bash
curl -sS http://100.86.175.53:11435/api/version | jq
```

---

## Planned image-generation service

```text
Proposed base URL: http://100.86.175.53:11436
Proposed route:    POST /v1/images/generations
Proposed model:    Stable Diffusion 1.5
Status:            Not implemented
```

---

## Endpoint summary

| Method | Endpoint                       | Purpose                      | Status          |
| ------ | ------------------------------ | ---------------------------- | --------------- |
| `POST` | `/api/chat`                    | Native Ollama chat           | Working         |
| `POST` | `/v1/chat/completions`         | OpenAI-compatible chat       | Working         |
| `POST` | `/api/embed`                   | Native Ollama embeddings     | Working         |
| `POST` | `/v1/embeddings`               | OpenAI-compatible embeddings | Working         |
| `GET`  | `/api/tags`                    | List installed models        | Available       |
| `GET`  | `/api/version`                 | Read Ollama version          | Available       |
| `POST` | `:11436/v1/images/generations` | Planned image generation     | Not implemented |
