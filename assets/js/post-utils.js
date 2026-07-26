/* Shared post utilities - used by blog.js, home-posts.js, and search */
const PostUtils = {
  tagLabel(t) {
    if (!t) return "Thoughts";
    return t.charAt(0).toUpperCase() + t.slice(1);
  },

  postCardHtml(p) {
    const tag = p.tag || "thoughts";
    const meta = [p.dateDisplay || "", this.tagLabel(tag)];
    if (p.readTime) meta.push(p.readTime);
    return (
      '<article class="card hover-card" data-tag="' +
      tag +
      '">' +
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
  },

  showToast(message, isError) {
    let toast = document.getElementById("globalToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "globalToast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast" + (isError ? " toast--error" : "");
    requestAnimationFrame(function () {
      toast.classList.add("toast--show");
    });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove("toast--show");
    }, 4000);
  },
};

window.PostUtils = PostUtils;