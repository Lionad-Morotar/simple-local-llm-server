import dayjs from "dayjs";

let context = [];
let responseTime;

const getTime = (time) => {
  return dayjs(time || new Date()).format("MM HH:mm:ss");
};

const error = (msg) => {
  console.error(msg);
  return msg;
};

async function getResponse(_opts) {
  const opts = Object.assign(
    {
      server: "lm-studio",
      system: "chat with user",
      user: "hello",
    },
    _opts || {}
  );

  const data = {
    messages: [
      {
        role: "system",
        content: opts.system,
      },
      {
        role: "user",
        content: `${opts.user}`,
        // content: "翻译成中文，仅返回译文：\n" + opts.user,
      },
    ],
    temperature: 0,
    max_tokens: opts.user.length,
    stream: false,
  };

  const response = await fetch("http://localhost:1234/v1/chat/completions", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  }).then(res => {
    return res.json()
  })

  const rets = response?.choices || []
  const ret = rets.find(x => x?.message?.role === 'assistant')

  return ret?.message?.content
}

async function getMessage(prompt, model = "qwen:7b") {
  const message = [];
  try {
    console.log("Sending message...");
    responseTime = new Date().getTime();

    const body = {
      model,
      prompt,
    };
    if (context.length) {
      body.context = context;
    }

    const response = await fetch("http://localhost:11434/api/generate", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
    });

    console.log("Generating response...");
    for await (const data of parseJsonStream(response.body)) {
      if (data.context) {
        context = data.context;
        console.log("Adding context...");
      }
      message.push(data.response);
    }

    console.log(message.join(""));
    console.log(
      "Executed in ",
      (new Date().getTime() - responseTime) / 1000,
      " seconds"
    );

    return message.join("");
  } catch (error) {
    return "error";
  }
}

async function* parseJsonStream(readableStream) {
  for await (const line of readLines(readableStream.getReader())) {
    const trimmedLine = line.trim().replace(/,$/, "");

    if (trimmedLine !== "[" && trimmedLine !== "]") {
      yield JSON.parse(trimmedLine);
    }
  }
}

async function* readLines(reader) {
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

function readChunks(reader) {
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
