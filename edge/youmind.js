// 使代码块复制按钮在滚动时吸附到视窗顶部并与容器右侧对齐
// 纯原生 JS，实现逐帧计算与轻量缓存
;(function () {
  "use strict";
  // 容器选择器：代码块整体
  const SELECTOR_CONTAINER = ".code-block-container";
  // 头部元素选择器：复制按钮
  const SELECTOR_HEADER = ".ym-code-block-copy-button";
  // 每多少次更新重新计算容器集合
  const TICK_RECALC = 10;
  // 站点存在 52px 固定头部，另加 4px 间距
  const OFFSET_TOP = 56;
  // 吸附时的层级
  const Z = "999";
  // 当前缓存的容器列表
  let containers = [];
  // 记录头部元素的初始内联样式，便于还原
  const headersInitial = new WeakMap();
  function collectContainers() {
    // 重新收集容器，并确保容器有定位上下文
    containers = Array.prototype.slice.call(document.querySelectorAll(SELECTOR_CONTAINER));
    for (let i = 0; i < containers.length; i++) {
      const c = containers[i];
      if (window.getComputedStyle(c).position === "static") c.style.position = "relative";
    }
  }
  function inViewport(crect) {
    // 判断容器是否与视窗有交集（有交集才参与吸附计算）
    return crect.bottom > 0 && crect.top < window.innerHeight;
  }
  function saveInitial(header) {
    // 首次处理时缓存初始样式
    if (!headersInitial.has(header)) headersInitial.set(header, header.getAttribute("style") || "");
  }
  function applyFixed(header, crect) {
    // 计算复制按钮在视窗中的固定位置，水平与容器右侧对齐，且限制在视窗范围内
    const w = header.offsetWidth || 0;
    const vw = window.innerWidth || 0;
    let left = crect.left + crect.width - w;
    if (left + w > vw) left = vw - w;
    if (left < 0) left = 0;
    header.style.position = "fixed"; // 固定到视窗顶部（考虑站点头部偏移与间距）
    header.style.top = `${OFFSET_TOP}px`;
    header.style.left = `${left}px`;
    header.style.zIndex = Z;
    header.dataset.stickyActive = "1";
  }
  function revert(header) {
    // 还原被吸附的复制按钮到初始样式
    if (!headersInitial.has(header)) return;
    const init = headersInitial.get(header);
    if (init) header.setAttribute("style", init);
    else {
      header.style.position = "";
      header.style.top = "";
      header.style.left = "";
      header.style.zIndex = "";
    }
    delete header.dataset.stickyActive;
  }
  function calcBlockHeaderSticky() {
    // 初始化容器并开启逐帧循环
    collectContainers();
    let tick = 0;
    function update() {
      // 逐帧推进，并定期重算容器集合以适配动态 DOM
      tick++;
      if (tick % TICK_RECALC === 0) collectContainers();
      for (let k = 0; k < containers.length; k++) {
        const c = containers[k];
        const header = c.querySelector(SELECTOR_HEADER);
        if (!header) continue;
        saveInitial(header);
        const crect = c.getBoundingClientRect();
        // 无交集则跳过计算，同时如已吸附则还原
        if (!inViewport(crect)) {
          if (header.dataset.stickyActive) revert(header);
          continue;
        }
        const h = header.offsetHeight || 0;
        // 容器顶部越过视窗（考虑偏移）且仍能容纳按钮高度与偏移时吸附，否则还原
        if (crect.top <= OFFSET_TOP && crect.bottom >= h + OFFSET_TOP) applyFixed(header, crect);
        else revert(header);
      }
      // 继续下一帧计算，避免滚动事件处理的频繁触发成本
      window.requestAnimationFrame(update);
    }
    window.requestAnimationFrame(update);
  }
  window.addEventListener("load", calcBlockHeaderSticky);
  window.calcBlockHeaderSticky = calcBlockHeaderSticky;
})();
