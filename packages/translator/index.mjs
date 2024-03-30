import Koa from "koa";
import BodyParser from "koa-bodyparser";
import NativeBird from "nativebird";
import { translateTo } from "./prompts/index.mjs";
import utils from "./utils.mjs";

const app = new Koa();
app.use(BodyParser());

app.use(async (ctx, next) => {
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

  console.log('source_lang:', source_lang)
  console.log('target_lang:', target_lang)
  console.log('text_list:', text_list)

  const res = await NativeBird.all(
    text_list.map(async (text) => {
      return await utils.getResponse({
        server: 'lm-studio',
        system: translateTo(targetLangName),
        user: text.trim(),
      });
    })
  );
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
console.log("app started at port 14686...");
