
import dayjs from "dayjs";

// ---- State & Defaults ----
let context = [];
let responseTime;

const DEFAULTS = {
  server: "lm-studio",
  model: "deepseek-chat",
  system: "chat with user",
  temperature: 0.2,
  stream: true,
  endpoints: {
    lmStudio: "http://localhost:1234/v1/chat/completions",
    ollamaGenerate: "http://localhost:11434/api/generate",
  },
};

// ---- Utils ----
export const getTime = (time) => dayjs(time || new Date()).format("MM HH:mm:ss");
export const error = (msg) => {
  console.error(msg);
  return msg;
};

// ---- Streaming helpers ----
async function parseSSEStream(readable) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  let reasoning = "";

  const handleLine = (line) => {
    // console.log('SSE line:', line);
    const s = line.trim();
    if (!s) return;
    if (s.startsWith("data:") && s.includes("[DONE]")) return;
    const payload = s.replace(/^data:\s*/, "");
    try {
      const json = JSON.parse(payload);
      const textChunk = json?.choices?.[0]?.delta?.content
        || json?.choices?.[0]?.message?.content
        || json?.message?.content
        || "";
      // console.log('SSE payload:', textChunk, reasonChunk);
      if (textChunk) out += textChunk;
    } catch (e) {
      // tolerate non-JSON lines present in some SSE implementations
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) handleLine(l);
  }
  if (buf.trim()) handleLine(buf);
  return out;
}

// ---- LM Studio Chat Completion ----
export async function getResponse(_opts) {
  const opts = { ...DEFAULTS, ..._opts };
  const streamEnabled = opts.stream ?? true;
  const user = String(opts.user ?? "hello");

  const body = {
    model: opts.model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: user },
    ],
    temperature: opts.temperature,
    max_tokens: 4096,
    stream: streamEnabled,
  };

  const res = await fetch(opts.endpoints.lmStudio, {
    headers: {
      Accept: streamEnabled ? "text/event-stream" : "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  // console.log('LM Studio response status:', res.status, res.ok, typeof res.body);

  if (!res.ok) {
    throw new Error(`LM Studio request failed: ${res.status} ${res.statusText}`);
  }

  if (streamEnabled && res.body) {
    return parseSSEStream(res.body);
  }

  const json = await res.json();
  const rets = json?.choices || [];
  const ret = rets.find((x) => x?.message?.role === "assistant");
  const text = ret?.message?.content || "";

  // console.log('LM Studio full response:', json, text, rets);
  return text;
}

// ---- Ollama Generate (stream JSON lines) ----
export async function getMessage(prompt, model) {
  const message = [];
  try {
    responseTime = Date.now();
    const body = { model, prompt };
    if (context.length) body.context = context;

    const res = await fetch(DEFAULTS.endpoints.ollamaGenerate, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
    });

    for await (const data of parseJsonStream(res.body)) {
      if (data.context) context = data.context;
      if (data.response) message.push(data.response);
    }

    return message.join("");
  } catch (e) {
    console.error("getMessage failed", e);
    return "error";
  } finally {
    if (responseTime) {
      const secs = (Date.now() - responseTime) / 1000;
      console.log("Executed in", secs, "seconds");
    }
  }
}

export async function* parseJsonStream(readableStream) {
  for await (const line of readLines(readableStream.getReader())) {
    const trimmedLine = line.trim().replace(/,$/, "");
    if (trimmedLine !== "[" && trimmedLine !== "]") {
      yield JSON.parse(trimmedLine);
    }
  }
}

export async function* readLines(reader) {
  const textDecoder = new TextDecoder();
  let partOfLine = "";
  for await (const chunk of readChunks(reader)) {
    const chunkText = textDecoder.decode(chunk);
    const chunkLines = chunkText.split("\n");
    if (chunkLines.length === 1) {
      partOfLine += chunkLines[0];
    } else if (chunkLines.length > 1) {
      yield partOfLine + chunkLines[0];
      for (let i = 1; i < chunkLines.length - 1; i++) {
        yield chunkLines[i];
      }
      partOfLine = chunkLines[chunkLines.length - 1];
    }
  }
}

export function readChunks(reader) {
  return {
    async *[Symbol.asyncIterator]() {
      let readResult = await reader.read();
      while (!readResult.done) {
        yield readResult.value;
        readResult = await reader.read();
      }
    },
  };
}

export default {
  getTime,
  error,
  getResponse,
  getMessage,
  parseJsonStream,
  readLines,
  readChunks,
  responseTime,
};
