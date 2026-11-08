(() => {
  "use strict";

  const article = document.getElementById("article-content");
  if (!article) return;

  if (typeof window.renderMathInElement === "function") {
    window.renderMathInElement(article, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
      strict: false,
      trust: false,
    });
  }

  article.querySelectorAll("table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", "表格，可横向滚动");
    table.before(wrapper);
    wrapper.append(table);
    if (wrapper.scrollWidth > wrapper.clientWidth) wrapper.tabIndex = 0;
  });

  article.querySelectorAll(".katex-display").forEach((formula) => {
    if (formula.scrollWidth > formula.clientWidth) {
      formula.tabIndex = 0;
      formula.setAttribute("role", "region");
      formula.setAttribute("aria-label", "公式，可横向滚动");
    }
  });

  const links = Array.from(document.querySelectorAll('.toc-nav a[href^="#"]'));
  const headings = Array.from(article.querySelectorAll("h2[id], h3[id], h4[id]"));
  if (!headings.length) return;
  const linkTargets = links.map((link) => {
    try {
      return decodeURIComponent(link.hash.slice(1));
    } catch {
      return link.hash.slice(1);
    }
  });
  let previousId = null;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 110) active = heading;
      else break;
    }
    if (active.id === previousId) return;
    previousId = active.id;
    links.forEach((link, i) => {
      if (linkTargets[i] === active.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", update, { passive: true });
  document.fonts?.ready.then(update);
  update();
})();
