(function () {
  const CONTAINER = document.getElementById("projectsContainer");

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  function depth() {
    return window.location.pathname.includes("/projects/") ? "../" : "";
  }

  function projectCardHtml(p) {
    const img = p.image
      ? '<img class="project-thumb" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.title) + '" loading="lazy" />'
      : '<div class="project-thumb project-thumb--placeholder" aria-hidden="true">\uD83D\uDCC1</div>';

    const tags = (p.tags || [])
      .map(function (t) { return '<span class="project-tag">' + escapeHtml(t) + "</span>"; })
      .join("");

    return (
      '<article class="card hover-card project-card" data-id="' + escapeHtml(p.id || "") + '">' +
      img +
      '<div class="project-body">' +
      "<h3>" + escapeHtml(p.title) + "</h3>" +
      '<p class="project-desc">' + escapeHtml(p.description || "") + "</p>" +
      '<div class="project-tags">' + tags + "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderEmpty() {
    CONTAINER.className = "";
    CONTAINER.innerHTML =
      '<div class="projects-empty">' +
      '<div class="projects-empty-icon">\uD83D\uDEA7</div>' +
      "<h2>Coming Soon</h2>" +
      '<p class="lead">I\'m still gathering my projects here. Check back later for university assignments, side experiments, and tools I\'ve built.</p>' +
      "</div>";
  }

  function renderGrid(projects) {
    CONTAINER.className = "projects-grid";
    CONTAINER.innerHTML = projects.map(projectCardHtml).join("");

    CONTAINER.querySelectorAll(".project-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.dataset.id;
        var project = projects.find(function (p) { return p.id === id; });
        if (project) openModal(project);
      });
    });

    if (typeof window.initScrollReveal === "function") {
      window.initScrollReveal();
    }
  }

  function openModal(project) {
    var existing = document.getElementById("projectModalOverlay");
    if (existing) existing.remove();

    var allImages = (project.images || []).slice();
    if (project.image && allImages.indexOf(project.image) === -1) {
      allImages.unshift(project.image);
    }

    var imagesHtml = allImages
      .map(function (src) {
        return '<img class="project-modal-img img-lightbox" src="' + escapeHtml(src) + '" alt="' + escapeHtml(project.title) + '" loading="lazy" />';
      })
      .join("");

    var tagsHtml = (project.tags || [])
      .map(function (t) { return '<span class="project-tag">' + escapeHtml(t) + "</span>"; })
      .join("");

    var detailBtn = project.file
      ? '<a href="' + depth() + escapeHtml(project.file) + '" class="btn btn-secondary" style="margin-right:0.5rem">View details</a>'
      : "";

    var linkBtn = project.link
      ? '<a href="' + escapeHtml(project.link) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Open project</a>'
      : "";

    var overlay = document.createElement("div");
    overlay.className = "media-modal-overlay";
    overlay.id = "projectModalOverlay";
    overlay.innerHTML =
      '<div class="media-modal card project-modal">' +
      '<button type="button" class="media-modal-close" aria-label="Close">&times;</button>' +
      (imagesHtml ? '<div class="project-modal-images">' + imagesHtml + "</div>" : "") +
      '<div class="project-modal-body">' +
      "<h2>" + escapeHtml(project.title) + "</h2>" +
      '<div class="project-tags" style="margin-bottom:0.75rem">' + tagsHtml + "</div>" +
      '<p class="project-modal-desc">' + escapeHtml(project.description || "") + "</p>" +
      '<div style="margin-top:1rem">' + detailBtn + linkBtn + "</div>" +
      "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    var close = function () {
      overlay.remove();
      document.body.style.overflow = "";
    };

    overlay.querySelector(".media-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    function keyHandler(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", keyHandler);
      }
    }
    document.addEventListener("keydown", keyHandler);

    overlay.querySelector(".media-modal-close").focus();
  }

  function init() {
    if (!CONTAINER) return;

    fetch(depth() + "projects/projects.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(function (data) {
        var projects = data && data.projects;
        if (!projects || projects.length === 0) {
          renderEmpty();
        } else {
          renderGrid(projects);
        }
      })
      .catch(function () {
        console.warn("Projects: failed to load project data");
        renderEmpty();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
