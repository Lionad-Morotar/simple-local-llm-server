import Koa from "koa";
import BodyParser from "koa-bodyparser";
import NPromise from "nativebird";
import { translateTo } from "./prompts/index.mjs";
import utils from "./utils.mjs";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Simple queue to serialize translation tasks to avoid model contention
const tasks = [];
let runningTask = null;

// ---- Lightweight file cache ----
const CACHE_DIR = path.join(os.tmpdir(), "local-llm-toolset", "translator");
const CACHE_FILE = path.join(CACHE_DIR, "translator-cache.json");
let CACHE = {};

async function loadCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const txt = await fs.readFile(CACHE_FILE, "utf8");
    CACHE = JSON.parse(txt || "{}");
  } catch {
    CACHE = {};
  }
}

async function saveCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(CACHE, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write cache", e);
  }
}

function cacheKey({ source_lang, target_lang, model, text }) {
  return `${source_lang}|${target_lang}|${model}|${text}`;
}

await loadCache();

setInterval(async () => {
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  if (!runningTask && tasks.length > 0) {
    const task = tasks.shift()
    runningTask = task
    const res = await task()
    const resolver = task.notifierResolver
    resolver(res)
    runningTask = null
  }
}, 100)

const addTask = async (task) => {
  let resolver = null;
  const notifier = new Promise((resolve) => { resolver = resolve; });
  task.notifier = notifier;
  task.notifierResolver = resolver;
  tasks.push(task);
  return await notifier;
};

const app = new Koa();
app.use(BodyParser());

// * cors
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (ctx.method == 'OPTIONS') {
    ctx.body = 200;
  } else {
    await next();
  }
})

app.use(async (ctx, next) => {
  // 5 minutes timeout per request
  ctx.req.setTimeout(5 * 60 * 1000);

  const id = Math.random().toString(36).substring(7);
  let data = {};
  try {
    data = typeof ctx.request.body === "object" ? ctx.request.body : JSON.parse(ctx.request.body);
  } catch (e) {
    console.error("Invalid JSON body", e);
    ctx.response.status = 400;
    ctx.response.body = { error: "Bad Request - Invalid JSON" };
    return;
  }

  const {
    source_lang = "en",
    target_lang = "zh-CN",
    text_list = [],
    model = "gpt-oss-safeguard-120b-mlx",
    // default to non-stream JSON for backward compatibility
    stream = false,
  } = data;

  if (!Array.isArray(text_list)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "text_list must be an array" };
    return;
  }

  const targetLangName = target_lang.includes("zh") ? "中文" : target_lang;

  console.log("-------------------");
  console.log("[source -> target]", id, source_lang, "->", target_lang);
  console.log("[input]", id, text_list);

  // Determine if client explicitly wants SSE stream
  const accept = ctx.get('accept') || '';
  const wantsSSE = stream === true || /text\/event-stream/i.test(accept);

  // Always add translation task to queue for this request
  if (wantsSSE) {
    // SSE streaming: emit each translated item as it completes
    ctx.req.setTimeout(0);
    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');
    ctx.set('X-Accel-Buffering', 'no');

    const write = (event, data) => {
      ctx.res.write(`event: ${event}\n`);
      ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const task = () => NPromise.mapSeries(text_list, async (text, idx) => {
      const input = String(text || '').trim();
      const payload = { index: idx, input };
      if (!input) {
        write('message', { ...payload, output: '' });
        return '';
      }
      // cache lookup
      const key = cacheKey({ source_lang, target_lang, model, text: input });
      let output = CACHE[key];
      if (!output) {
        output = await utils.getResponse({
          server: 'lm-studio',
          system: translateTo(targetLangName),
          user: input,
          model,
          stream: true,
        });
        CACHE[key] = String(output || '').trim();
        await saveCache();
      }
      write('message', { ...payload, output: String(output || '').trim() });
      return String(output || '').trim();
    });

    const list = await addTask(task);
    // Log aggregated outputs for observability
    try {
      const res = (list || []).map((x) => (String(x || '').trim() || '[empty]'));
      console.log('[output]', id, res);
    } catch {}
    write('end', { done: true });
    ctx.res.end();
    return; // streamed response complete
  } else {
    // Non-stream JSON aggregation
    const task = () =>
      NPromise.mapSeries(text_list, async (text) => {
        const input = String(text || "").trim();
        if (!input) return "";
        const key = cacheKey({ source_lang, target_lang, model, text: input });
        let res = CACHE[key];
        if (!res) {
          res = await utils.getResponse({
            server: "lm-studio",
            system: translateTo(targetLangName),
            user: input,
            model,
            stream: false,
          });
          CACHE[key] = String(res || '').trim();
          await saveCache();
        }
        return res;
      });

    const list = (await addTask(task)) || [];
    const res = list.map((x) => (String(x || "").trim() || "[empty]"));

    console.log("[output]", id, res);

    const ret = {
      translations: res.map((text = "") => ({ detected_source_lang: source_lang, text })),
    };

    await next();
    ctx.response.type = "application/json";
    ctx.response.body = ret;
  }
});

app.listen(14686);
console.clear();
console.log("app started at port 14686...");
