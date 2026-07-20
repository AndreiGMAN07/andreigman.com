const STORAGE_KEY = "resourcesData";
let manageOn = false;

/* ── Default data ── */
const DEFAULTS = {
  notes: [],
  courses: [],
  files: [
    {
      id: "drive-highschool",
      title: "Highschool Files",
      url: "https://drive.google.com/drive/folders/1Pdny61HOaFEQu-Jd3ZCyskeCKBbjd6Jf?usp=sharing",
      type: "link",
    },
  ],
};

/* ── Storage helpers ── */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults so missing keys still exist
      for (const key of Object.keys(DEFAULTS)) {
        if (!parsed[key]) parsed[key] = [];
      }
      return parsed;
    }
  } catch {}
  // Deep clone defaults
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Toast ── */
function toast(msg, isError) {
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " toast--error" : "");
  el.textContent = msg;
  document.body.appendChild(el);
  el.offsetHeight;
  el.classList.add("toast--show");
  setTimeout(() => {
    el.classList.remove("toast--show");
    setTimeout(() => el.remove(), 300);
  }, isError ? 5000 : 3000);
}

/* ── Make ID ── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── HTML escape ── */
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/* ── Render all categories ── */
let data = loadData();

function renderAll() {
  ["notes", "courses", "files"].forEach(renderCategory);
}

function renderCategory(cat) {
  const list = document.getElementById("list-" + cat);
  if (!list) return;
  const items = data[cat] || [];

  let html = "";

  if (items.length) {
    html += items
      .map((r) => {
        const del = manageOn
          ? '<button class="res-del" data-cat="' +
            cat +
            '" data-id="' +
            r.id +
            '" aria-label="Delete">&times; Remove</button>'
          : "";
        let ext = "";
        if (r.filename) {
          const parts = r.filename.split(".");
          if (parts.length > 1) ext = parts.pop().toUpperCase();
        }
        const size = r.size ? " (" + fmtSize(r.size) + ")" : "";
        return (
          '<li class="res-item">' +
          del +
          '<a href="' +
          esc(r.url) +
          '" target="_blank" rel="noopener">' +
          esc(r.title) +
          "</a>" +
          (ext ? ' <span class="res-badge">' + ext + "</span>" : "") +
          size +
          "</li>"
        );
      })
      .join("");
  } else {
    html += '<li class="empty-msg"><em>Nothing yet</em></li>';
  }

  list.innerHTML = html;

  if (manageOn) {
    Array.from(document.querySelectorAll(".res-del")).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        removeItem(btn.dataset.cat, btn.dataset.id);
      });
    });
  }
}

/* ── Remove item ── */
function removeItem(cat, id) {
  if (!manageOn) return;
  data[cat] = (data[cat] || []).filter((r) => r.id !== id);
  saveData(data);
  renderAll();
  toast("Removed");
}

/* ── Add link ── */
function addLink(cat) {
  if (!manageOn) return;
  const container = document.getElementById("manage-" + cat);
  const title = container.querySelector(".link-title").value.trim();
  const url = container.querySelector(".link-url").value.trim();
  if (!title || !url) {
    toast("Title and URL are required");
    return;
  }
  if (!data[cat]) data[cat] = [];
  data[cat].push({ id: uid(), title, url, type: "link" });
  saveData(data);
  container.querySelector(".link-title").value = "";
  container.querySelector(".link-url").value = "";
  renderAll();
  toast("Link added");
}

/* ── Upload file (read as base64 data URL) ── */
function uploadFile(cat, file) {
  if (!manageOn) return;
  if (file.size > 4 * 1024 * 1024) {
    toast("File too large (max 4 MB)", true);
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const url = e.target.result;
    if (!data[cat]) data[cat] = [];
    data[cat].push({
      id: uid(),
      title: file.name.replace(/\.[^.]+$/, ""),
      url: url,
      type: "file",
      filename: file.name,
      size: file.size,
    });
    saveData(data);
    renderAll();
    toast("Uploaded " + file.name);
  };
  reader.onerror = function () {
    toast("Failed to read file", true);
  };
  reader.readAsDataURL(file);
}

/* ── Setup drop zones ── */
function setupDropZones() {
  document.querySelectorAll(".drop-zone").forEach((zone) => {
    const input = zone.querySelector("input[type=file]");
    const cat = zone.dataset.category;

    // Click to browse
    zone.addEventListener("click", () => {
      if (manageOn) input && input.click();
    });

    // File input change
    input &&
      input.addEventListener("change", () => {
        if (!manageOn) return;
        Array.from(input.files).forEach((f) => uploadFile(cat, f));
        input.value = "";
      });

    // Drag events
    zone.addEventListener("dragover", (e) => {
      if (!manageOn) return;
      e.preventDefault();
      zone.classList.add("drop-zone--over");
    });
    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drop-zone--over");
    });
    zone.addEventListener("drop", (e) => {
      if (!manageOn) return;
      e.preventDefault();
      zone.classList.remove("drop-zone--over");

      // Check for dropped files
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        Array.from(files).forEach((f) => uploadFile(cat, f));
        return;
      }

      // Check for dropped URL text
      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        const container = document.getElementById("manage-" + cat);
        const urlInput = container.querySelector(".link-url");
        urlInput.value = text;
        urlInput.focus();
        toast("Pasted URL — add a title and click Add Link");
      }
    });
  });
}

/* ── Init ── */
function initResources() {
  renderAll();
  setupDropZones();

  // Manage toggle
  document.getElementById("manageToggle").addEventListener("click", function () {
    manageOn = !manageOn;
    this.textContent = manageOn ? "\u2714 Managing" : "\u270E Manage";
    document.querySelectorAll(".manage-scope").forEach((el) => {
      el.hidden = !manageOn;
    });
    renderAll();
    toast(manageOn ? "Manage mode ON" : "Manage mode OFF");
  });

  // Add link buttons
  document.querySelectorAll(".add-link-btn").forEach((btn) => {
    btn.addEventListener("click", () => addLink(btn.dataset.category));
  });

  // Enter key on URL input
  document.querySelectorAll(".link-url").forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cat = inp.closest(".manage-scope").dataset.category;
        addLink(cat);
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initResources);
} else {
  initResources();
}