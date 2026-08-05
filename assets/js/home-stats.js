(function () {
  "use strict";

  var postsEl = document.getElementById("statPosts");
  var projectsEl = document.getElementById("statProjects");
  if (!postsEl || !projectsEl) return;

  Promise.all([
    fetch("posts/posts.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("projects/projects.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }),
  ])
    .then(function (results) {
      var posts = results[0] && results[0].posts ? results[0].posts.length : 0;
      var projects = results[1] && Array.isArray(results[1]) ? results[1].length : 0;
      if (projects === 0 && results[1] && results[1].projects) {
        projects = results[1].projects.length;
      }
      postsEl.setAttribute("data-count", posts);
      projectsEl.setAttribute("data-count", projects);
    })
    .catch(function () {})
    .then(function () {
      document.querySelectorAll(".cyber-stat__num[data-count]").forEach(function (el) {
        animateCount(el, parseInt(el.getAttribute("data-count") || "0", 10));
      });
    });

  function animateCount(el, target) {
    var current = 0;
    var step = Math.max(1, Math.round(target / 40));
    var timer = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current;
    }, 24);
  }
})();