const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require("turndown");
const { parentPort, workerData } = require("worker_threads");

try {
  const { htmlPath, mdPath } = workerData;

  const html = fs.readFileSync(htmlPath, "utf-8");
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    parentPort.postMessage({
      success: false,
      filename: path.basename(htmlPath),
      error: new Error("无法解析文章"),
    });
    return;
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  const md = `# ${article.title}\n\n` + turndown.turndown(article.content);
  fs.writeFileSync(mdPath, md);

  parentPort.postMessage({
    success: true,
    filename: path.basename(htmlPath),
  });
} catch (error) {
  parentPort.postMessage({
    success: false,
    filename: path.basename(workerData.htmlPath),
    error,
  });
}
