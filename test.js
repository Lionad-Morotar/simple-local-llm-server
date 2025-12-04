function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        // 双引号转义为一个引号
        field += '"';
        i += 2;
        continue;
      } else {
        // 进入或退出引号模式
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === "," && !inQuotes) {
      // 字段结束
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      // 行结束
      // 处理 \r\n 或 \n\r
      if (char === "\r" && csvText[i + 1] === "\n") i++;
      else if (char === "\n" && csvText[i + 1] === "\r") i++;

      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    // 普通字符
    field += char;
    i++;
  }

  // 最后一行
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // 将第一行作为表头
  const headers = rows.shift();
  return rows.map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] || "";
    });
    return obj;
  });
}

const isNumber = (x) => typeof x === "number" && !isNaN(x);
const isNumberLike = (x) => isNumber(+x);

const preserveSplit = (x) =>
  x
    .split(/([。！？?！])/g)
    .filter(Boolean) // 去除空字符串
    .reduce((acc, cur, idx) => {
      if (idx % 2 === 0) {
        acc.push(cur); // 添加句子
      } else {
        acc[acc.length - 1] += cur; // 将标点符号附加到前一句
      }
      return acc;
    }, []);

async function main({ params }) {
  let textXS = [];
  let slicedTextXS = [];

  if (!params.isLink) {
    textXS = params.rawText.flatMap((x) => preserveSplit(x));
  } else {
    const csv = params.input;
    const lines = parseCSV(csv);
    const keys = Object.keys(lines[0]);

    // 选一个不是数字的栏
    const targetKey = keys.find((k) => {
      return !isNumberLike(lines[0][k]);
    });

    // 如果没找到合适的栏，返回全部文本拼接
    if (!targetKey) {
      textXS = lines.flatMap((x) => preserveSplit(x.join(",")));
    } else {
      textXS = lines.flatMap((x) => preserveSplit(x[targetKey]));
    }
  }

  // 截取前中后各200字内容（不重合）
  const sliceLen = 200;
  const total = textXS.join("\n");
  const totalLen = total.length;
  console.log("totalLen", totalLen, total);
  if (totalLen > sliceLen * 3) {
    slicedTextXS = [
      total.slice(0, sliceLen),
      total.slice(
        Math.floor((totalLen - sliceLen) / 2) - Math.floor(sliceLen / 2),
        Math.floor((totalLen - sliceLen) / 2) + Math.ceil(sliceLen / 2)
      ),
      total.slice(totalLen - sliceLen),
    ];
  } else if (totalLen > sliceLen * 2) {
    slicedTextXS = [
      total.slice(0, sliceLen),
      "......（中间内容省略）......",
      total.slice(totalLen - sliceLen),
    ];
  } else {
    slicedTextXS = [total];
  }

  const ret = {
    text: textXS,
    slicedText: slicedTextXS.join("\n"),
  };

  return ret;
}

const res = main({
  params: {
    isLink: false,
    rawText: [
      "这是第一句话。这是第二句话！这是第三句话？",
      "这里是另一段文本。包含多个句子！看看效果如何？",
    ],
  },
});

console.log(res);
