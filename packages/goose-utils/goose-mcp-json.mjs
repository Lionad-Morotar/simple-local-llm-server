import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

function expandHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === "~") return process.env.HOME ?? inputPath;
  if (inputPath.startsWith("~/")) return path.join(process.env.HOME ?? "", inputPath.slice(2));
  return inputPath;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const picks = [];
  let inputPath;
  let outputPath;
  let watch = false;
  let debounceMs = 150;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--watch") {
      watch = true;
      continue;
    }
    if (token === "--pick") {
      const value = args[i + 1];
      if (!value) throw new Error("Missing value for --pick");
      picks.push(value);
      i += 1;
      continue;
    }
    if (token === "--input") {
      const value = args[i + 1];
      if (!value) throw new Error("Missing value for --input");
      inputPath = value;
      i += 1;
      continue;
    }
    if (token === "--output") {
      const value = args[i + 1];
      if (!value) throw new Error("Missing value for --output");
      outputPath = value;
      i += 1;
      continue;
    }
    if (token === "--debounce-ms") {
      const value = args[i + 1];
      if (!value) throw new Error("Missing value for --debounce-ms");
      debounceMs = Number(value);
      if (!Number.isFinite(debounceMs) || debounceMs < 0) throw new Error("Invalid --debounce-ms");
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return { inputPath, outputPath, picks, watch, debounceMs };
}

function getByPath(obj, pickPath) {
  if (!pickPath || pickPath === ".") return obj;
  const parts = pickPath.split(".").filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

function setByPath(obj, pickPath, value) {
  if (!pickPath || pickPath === ".") return value;
  const parts = pickPath.split(".").filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    const isLeaf = i === parts.length - 1;
    if (isLeaf) {
      current[key] = value;
      return obj;
    }
    const next = current[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key];
  }
  return obj;
}

async function exportMcpToJson({ inputPath, outputPath, picks }) {
  const raw = await fsp.readFile(inputPath, "utf8");
  const parsed = YAML.parse(raw);
  const selected =
    !picks || picks.length === 0
      ? parsed
      : picks.reduce((acc, pickPath) => {
        const value = getByPath(parsed, pickPath);
        return setByPath(acc, pickPath, value);
      }, {});
  const extensions = (Object.values(selected.extensions) || [])
    .filter(x => x.enabled)
    .filter(x => !x?.bundled)
    .reduce((exts, cur) => {
      const validName = cur.name
      exts[validName] = cur
      return exts
    }, {})
  const mcpJSON = {
    "mcpServers": extensions
  }

  const json = `${JSON.stringify(mcpJSON, null, 2)}\n`;
  await fsp.writeFile(outputPath, json, "utf8");
}

function createDebouncedRunner(fn, debounceMs) {
  let timer = null;
  let running = false;
  let rerun = false;

  async function runNow() {
    if (running) {
      rerun = true;
      return;
    }
    running = true;
    try {
      do {
        rerun = false;
        await fn();
      } while (rerun);
    } finally {
      running = false;
    }
  }

  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void runNow();
    }, debounceMs);
  };
}

async function main() {
  const { inputPath, outputPath, picks, watch, debounceMs } = parseArgs(process.argv);

  const resolvedInput =
    expandHome(inputPath) ?? path.join(process.env.HOME ?? "", ".config/goose/config.yaml");
  const resolvedOutput = expandHome(outputPath) ?? path.join(path.dirname(resolvedInput), "config.json");

  const doExport = async () => {
    await exportMcpToJson({ inputPath: resolvedInput, outputPath: resolvedOutput, picks });
    process.stdout.write(`[goose-config] exported ${path.basename(resolvedInput)} -> ${path.basename(resolvedOutput)}\n`);
  };

  await doExport();
  if (!watch) return;

  const trigger = createDebouncedRunner(doExport, debounceMs);
  const watcher = fs.watch(resolvedInput, { persistent: true }, () => trigger());

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    watcher.close();
    process.exit(0);
  });
}

await main();
