import Koa from "koa";
import BodyParser from "koa-bodyparser";
import NPromise from "nativebird";
import { translateTo } from "./prompts/index.mjs";
import utils from "./utils.mjs";

const tasks = [];
let runningTask = null;

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
}, 1000)

const addTask = async (task) => {
  let resolver = null
  const notifier = new Promise((resolve) => {
    resolver = resolve
  })
  task.notifier = notifier
  task.notifierResolver = resolver
  tasks.push(task)
  return await notifier
};

const app = new Koa();
app.use(BodyParser());

app.use(async (ctx, next) => {
  const id = Math.random().toString(36).substring(7);
  let data = {};
  try {
    data =
      typeof ctx.request.body === "object"
        ? ctx.request.body
        : JSON.parse(ctx.request.body);
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = "Bad Request - Invalid JSON";
  }

  const { source_lang = "en", target_lang = "zh-CN", text_list = [] } = data; 
  const targetLangName = target_lang.includes('zh')
    ? '中文'
    : target_lang

  console.log('-------------------')
  console.log('[source -> target]', id, source_lang, '->', target_lang)
  console.log('[input]', id, text_list) 

  const task = () => NPromise.mapSeries( 
    text_list,
    (async (text) => {
      return await utils.getMeaningfulResponse({
        server: 'lm-studio',
        system: translateTo(targetLangName),
        user: text.trim(),
      });
    })
  )

  const res = ((await addTask(task)) || []).map(x => x.trim()).map(x => x || '[empty]');

  console.log('[output]', id, res)

  const ret = {
    translations: res.map((text = '') => {
      return {
        detected_source_lang: source_lang,
        text,
      };
    }),
  };

  await next();
  ctx.response.type = "application/json";
  ctx.response.body = ret;
});

app.listen(14686);
console.clear();
console.log("app started at port 14686...");
