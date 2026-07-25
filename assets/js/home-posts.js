(function () {
  function tagLabel(t) {
    if (!t) return "Thoughts";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function postCardHtml(p) {
    const tag = p.tag || "thoughts";
    const meta = [p.dateDisplay || "", tagLabel(tag)];
    if (p.readTime) meta.push(p.readTime);
    return (
      '<article class="card hover-card">' +
      '<p class="mini-meta">' +
      meta.join(" &middot; ") +
      "</p>" +
      "<h3>" +
      (p.title || "(untitled)") +
      "</h3>" +
      "<p>" +
      (p.blurb || "") +
      "</p>" +
      '<a href="' +
      (p.file || "#") +
      '" class="text-link">Read post</a>' +
      "</article>"
    );
  }

  (async function () {
    const list = document.getElementById("latestPosts");
    if (!list) return;
    try {
      const res = await fetch("posts/posts.json", { cache: "no-cache" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.posts) || data.posts.length === 0) return;
      const sorted = data.posts
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 3);
      list.innerHTML = sorted.map(postCardHtml).join("");
      if (typeof window.initScrollReveal === "function") {
        window.initScrollReveal();
      }
    } catch (e) {
      /* offline or missing feed */
    }
  })();
})();
