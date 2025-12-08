export const translateTo = (targetLang = '中文') => {
  return `翻译成${targetLang}，直接返回翻译结果：`

  // * old version

  // Here are some examples of the expected input and output:
  // first example:
  // User input:
  // Ask {0}: Can we do better than Git for version control?
  // Assistant response:
  // 来自 {0} 的提问: 我们在版本控制方面能做得比 Git 更好吗？

  // second example:
  // User input:
  // Can I help you, {0}?
  // Assistant response:
  // 我能帮助你吗，{0}？

  // third example:
  // User input:
  // Node 10 and shell isn't supported anymore
  // Assistant response:
  // Node 10 和 shell 不再受支持
}
