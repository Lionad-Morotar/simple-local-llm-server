import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const HTML_DIR = path.join(__dirname, ".html");
const MD_DIR = path.join(__dirname, ".md");

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取所有 HTML 文件
 */
function getHtmlFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".html"));
}

/**
 * 转换单个 HTML 文件为 Markdown
 */
function convertHtmlToMarkdown(htmlPath: string, mdPath: string): void {
  const html = fs.readFileSync(htmlPath, "utf-8");
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    console.warn(`⚠️  无法解析文件: ${path.basename(htmlPath)}`);
    return;
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  const md = `# ${article.title}\n\n` + turndown.turndown(article.content);
  fs.writeFileSync(mdPath, md);
}

/**
 * 批量转换 HTML 文件
 */
function batchConvert(): void {
  // 确保输出目录存在
  ensureDirectoryExists(MD_DIR);

  // 获取所有 HTML 文件
  const htmlFiles = getHtmlFiles(HTML_DIR);
  const total = htmlFiles.length;

  if (total === 0) {
    console.log("📂 未找到任何 HTML 文件");
    return;
  }

  console.log(`🚀 开始转换 ${total} 个文件...\n`);

  // 遍历转换
  htmlFiles.forEach((filename, index) => {
    const htmlPath = path.join(HTML_DIR, filename);
    const mdFilename = filename.replace(/\.html$/, ".md");
    const mdPath = path.join(MD_DIR, mdFilename);

    try {
      convertHtmlToMarkdown(htmlPath, mdPath);
      console.log(`✅ [${index + 1}/${total}] ${filename} → ${mdFilename}`);
    } catch (error) {
      console.error(`❌ [${index + 1}/${total}] ${filename} 转换失败:`, error);
    }
  });

  console.log(`\n🎉 转换完成！共处理 ${total} 个文件`);
}

// 执行转换
batchConvert();
