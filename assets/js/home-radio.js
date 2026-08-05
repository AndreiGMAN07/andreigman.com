(function () {
  "use strict";

  var SESSION_KEY = "radio-session";
  var DB_NAME = "radio-db";
  var DB_STORE = "songs";

  var state = { songs: [], current: -1 };
  var audio = new Audio();
  var coverCache = {};

  var el = {
    upload: document.getElementById("radioUpload"),
    input: document.getElementById("radioFiles"),
    list: document.getElementById("radioList"),
    error: document.getElementById("radioError"),
    dock: document.getElementById("radioDock"),
    cover: document.getElementById("dockCover"),
    title: document.getElementById("dockTitle"),
    artist: document.getElementById("dockArtist"),
    play: document.getElementById("dockPlay"),
    prev: document.getElementById("dockPrev"),
    next: document.getElementById("dockNext"),
    seek: document.getElementById("dockSeek"),
    time: document.getElementById("dockTime"),
    deviceTitle: document.getElementById("deviceTitle"),
    deviceArtist: document.getElementById("deviceArtist"),
    deviceFreq: document.getElementById("deviceFreq"),
    deviceNeedle: document.getElementById("deviceNeedle"),
    devicePlay: document.getElementById("devicePlay"),
    volumeBtn: document.getElementById("volumeBtn"),
    deviceVol: document.getElementById("deviceVol"),
    folderBtn: document.getElementById("radioFolderBtn"),
    folder: document.getElementById("radioFolder"),
  };
  if (!el.upload || !el.dock) return;

  /* ---------------- IndexedDB (bytes live only while session is alive) ---------------- */

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(DB_STORE, { keyPath: "id" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(song) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(song);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbAll() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(DB_STORE).objectStore(DB_STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbDelete(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbClear() {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).clear();
        tx.oncomplete = resolve;
      });
    });
  }

  /* ---------------- Metadata (jsmediatags, loaded on demand) ---------------- */

  var metaLibPromise = null;
  function loadMetaLib() {
    if (window.jsmediatags) return Promise.resolve();
    if (metaLibPromise) return metaLibPromise;
    metaLibPromise = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js";
      s.onload = resolve;
      s.onerror = function () { window.jsmediatags = null; resolve(); };
      document.head.appendChild(s);
    });
    return metaLibPromise;
  }

  function readTags(file) {
    return loadMetaLib().then(function () {
      if (!window.jsmediatags) return {};
      return new Promise(function (resolve) {
        try {
          window.jsmediatags.read(file, {
            onSuccess: function (tag) { resolve(tag.tags || {}); },
            onError: function () { resolve({}); },
          });
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  function pictureBlob(picture) {
    if (!picture || !picture.data) return null;
    try {
      var bytes = picture.data;
      if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
      return new Blob([bytes], { type: picture.format || "image/jpeg" });
    } catch (e) {
      return null;
    }
  }

  function stripExt(name) {
    return (name || "").replace(/\.[^.]+$/, "");
  }

  function randomFreq() {
    return 10 + Math.floor(Math.random() * 191);
  }

  /* ---------------- Playlist ---------------- */

  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList).filter(function (f) {
      return /^audio\//.test(f.type) || /\.(flac|mp3|ogg|m4a|wav|opus)$/i.test(f.name);
    });
    if (!files.length) {
      showError("No supported audio files (FLAC, MP3, OGG, M4A, WAV).");
      return;
    }
    files.sort(function (a, b) {
      return (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name);
    });
    var jobs = files.map(function (file) {
      return readTags(file).then(function (tags) {
        var coverBlob = pictureBlob(tags.picture);
        var song = {
          id: "s" + Date.now() + Math.random().toString(36).slice(2, 8),
          file: file,
          title: tags.title || stripExt(file.name),
          artist: tags.artist || "Unknown artist",
          album: tags.album || "",
          coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : "",
          freq: randomFreq(),
          path: file.webkitRelativePath || "",
        };
        state.songs.push(song);
        idbPut({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          cover: coverBlob,
          blob: file,
          freq: song.freq,
          path: song.path,
        });
      });
    });
    Promise.all(jobs).then(function () {
      sortSongs();
      renderList();
      if (state.current === -1 && state.songs.length) playAt(0);
    });
  }

  function dirOf(song) {
    if (!song.path) return "";
    return song.path.slice(0, song.path.lastIndexOf("/"));
  }

  function sortSongs() {
    var curId = state.current >= 0 ? state.songs[state.current].id : null;
    state.songs.sort(function (a, b) {
      return (dirOf(a) + "/" + a.title).localeCompare(dirOf(b) + "/" + b.title);
    });
    if (curId) {
      for (var i = 0; i < state.songs.length; i++) {
        if (state.songs[i].id === curId) { state.current = i; break; }
      }
    }
  }

  function renderList() {
    el.list.innerHTML = "";
    var lastDir = null;
    state.songs.forEach(function (song, i) {
      var dir = dirOf(song);
      if (dir !== lastDir) {
        lastDir = dir;
        if (dir) {
          var head = document.createElement("li");
          head.className = "radio-list__dir";
          var icon = document.createElement("span");
          icon.className = "radio-list__dir-icon";
          icon.textContent = "\u25B8";
          head.appendChild(icon);
          head.appendChild(document.createTextNode(dir));
          el.list.appendChild(head);
        }
      }
      var li = document.createElement("li");
      li.className = "radio-list__item";
      if (i === state.current) li.classList.add("is-active");
      var num = document.createElement("span");
      num.className = "radio-list__num";
      num.textContent = String(i + 1).padStart(2, "0");
      var meta = document.createElement("span");
      meta.className = "radio-list__meta";
      meta.textContent = song.title + " — " + song.artist;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "radio-list__play";
      btn.setAttribute("aria-label", "Play " + song.title);
      btn.textContent = i === state.current && !audio.paused ? "||" : ">";
      btn.addEventListener("click", function () {
        if (i === state.current) togglePlay();
        else playAt(i);
      });
      var del = document.createElement("button");
      del.type = "button";
      del.className = "radio-list__del";
      del.setAttribute("aria-label", "Remove " + song.title);
      del.textContent = "\u2715";
      del.addEventListener("click", function () {
        removeSong(i);
      });
      li.appendChild(num);
      li.appendChild(meta);
      li.appendChild(btn);
      li.appendChild(del);
      el.list.appendChild(li);
    });
  }

  function removeSong(i) {
    if (i < 0 || i >= state.songs.length) return;
    var song = state.songs[i];
    idbDelete(song.id);
    if (song.coverUrl) URL.revokeObjectURL(song.coverUrl);
    state.songs.splice(i, 1);
    if (state.current === i) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      state.current = -1;
      el.dock.hidden = true;
      el.deviceTitle.textContent = "NO SIGNAL";
      el.deviceArtist.textContent = "insert audio below";
      if (el.deviceFreq) el.deviceFreq.textContent = "\u2014";
      updatePlayBtn();
      if (state.songs.length) playAt(0);
    } else if (state.current > i) {
      state.current--;
    }
    renderList();
  }

  function playAt(i) {
    if (i < 0 || i >= state.songs.length) return;
    state.current = i;
    var song = state.songs[i];
    if (song.file instanceof Blob) {
      audio.src = URL.createObjectURL(song.file);
    }
    audio.play().catch(function () {});
    updateDock();
    renderList();
  }

  function togglePlay() {
    if (state.current === -1) return;
    var song = state.songs[state.current];
    if (!audio.src && song.file instanceof Blob) {
      audio.src = URL.createObjectURL(song.file);
    }
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
    updatePlayBtn();
    renderList();
  }

  var VOL_STEPS = [0, 0.25, 0.5, 0.75, 1];

  function cycleVolume() {
    var i = VOL_STEPS.indexOf(Math.round(audio.volume * 4) / 4);
    if (i === -1) i = 4;
    audio.volume = VOL_STEPS[(i + 1) % VOL_STEPS.length];
    updateVolume();
  }

  function updateVolume() {
    var pct = Math.round(audio.volume * 100);
    if (el.deviceVol) el.deviceVol.textContent = "VOL " + pct;
    if (el.volumeBtn) el.volumeBtn.style.setProperty("--vol", audio.volume);
  }

  function nextTrack() { playAt((state.current + 1) % state.songs.length); }
  function prevTrack() { playAt((state.current - 1 + state.songs.length) % state.songs.length); }

  function updateDock() {
    if (!state.songs.length) return;
    var song = state.songs[state.current];
    el.dock.hidden = false;
    el.title.textContent = song.title;
    el.artist.textContent = song.artist + (song.album ? " — " + song.album : "");
    el.deviceTitle.textContent = song.title;
    el.deviceArtist.textContent = song.artist;
    if (el.deviceFreq) el.deviceFreq.textContent = song.freq + " MHz";
    if (el.deviceNeedle) el.deviceNeedle.style.left = (10 + ((song.freq - 10) / 190) * 80) + "%";
    if (song.coverUrl) {
      el.cover.style.backgroundImage = "url(" + song.coverUrl + ")";
    } else {
      el.cover.style.backgroundImage = "";
    }
    updatePlayBtn();
  }

  function updatePlayBtn() {
    var playing = !audio.paused;
    el.play.textContent = playing ? "\u275A\u275A" : "\u25B6";
    el.play.setAttribute("aria-label", playing ? "Pause" : "Play");
    el.upload.classList.toggle("is-playing", playing);
  }

  function showError(msg) {
    el.error.textContent = msg;
    el.error.hidden = false;
    setTimeout(function () { el.error.hidden = true; }, 3500);
  }

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  }

  /* ---------------- Session lifecycle: survive refresh, die on close ---------------- */

  function restoreSession() {
    if (sessionStorage.getItem(SESSION_KEY)) {
      idbAll().then(function (rows) {
        rows.forEach(function (row) {
          state.songs.push({
            id: row.id,
            file: row.blob,
            title: row.title,
            artist: row.artist,
            album: row.album,
            coverUrl: row.cover ? URL.createObjectURL(row.cover) : "",
            freq: row.freq || randomFreq(),
            path: row.path || "",
          });
        });
        sortSongs();
        renderList();
        if (rows.length) {
          if (state.current === -1) state.current = 0;
          updateDock();
        }
      });
    } else {
      sessionStorage.setItem(SESSION_KEY, "1");
      idbClear();
    }
  }

  /* ---------------- Events ---------------- */

  el.input.addEventListener("change", function () {
    addFiles(el.input.files);
    el.input.value = "";
  });

  if (el.folderBtn && el.folder) {
    el.folderBtn.addEventListener("click", function () {
      el.folder.click();
    });
    el.folder.addEventListener("change", function () {
      addFiles(el.folder.files);
      el.folder.value = "";
    });
  }

  el.upload.addEventListener("dragover", function (e) {
    e.preventDefault();
    el.upload.classList.add("is-over");
  });
  el.upload.addEventListener("dragleave", function () {
    el.upload.classList.remove("is-over");
  });
  el.upload.addEventListener("drop", function (e) {
    e.preventDefault();
    el.upload.classList.remove("is-over");
    addFiles(e.dataTransfer.files);
  });

  el.play.addEventListener("click", togglePlay);
  el.next.addEventListener("click", nextTrack);
  el.prev.addEventListener("click", prevTrack);
  if (el.devicePlay) el.devicePlay.addEventListener("click", togglePlay);
  if (el.volumeBtn) el.volumeBtn.addEventListener("click", cycleVolume);
  el.seek.addEventListener("input", function () {
    if (audio.duration) audio.currentTime = (el.seek.value / 1000) * audio.duration;
  });

  audio.addEventListener("timeupdate", function () {
    if (!audio.duration) return;
    el.seek.value = (audio.currentTime / audio.duration) * 1000;
    el.time.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });
  audio.addEventListener("ended", nextTrack);
  audio.addEventListener("play", function () { updatePlayBtn(); renderList(); });
  audio.addEventListener("pause", function () { updatePlayBtn(); renderList(); });

  updateVolume();
  restoreSession();
})();