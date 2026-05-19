// Catalog page: array of objects, Handlebars rendering, search/sort,
// add/edit/delete, localStorage, modal with cover photos.

Handlebars.registerHelper("upper", (text) => String(text).toUpperCase());

const STORAGE_KEY = VinylData.STORAGE_KEY;
const MIN_SONG_ROWS = 2;
const MIN_YEAR = 1900;
const MAX_YEAR = 2099;

let vinylRecords = [];
let catalogSwiperInstance = null;
let editingId = null;

const normalizeSongEntry = (entry) => {
  if (typeof entry === "string") {
    return { title: entry, bpm: null };
  }
  const title = entry.title || entry.name || "";
  let bpm = entry.bpm;
  if (bpm === "" || bpm === undefined || bpm === null) {
    bpm = null;
  } else {
    bpm = Number(bpm);
    if (Number.isNaN(bpm) || bpm <= 0) {
      bpm = null;
    } else {
      bpm = Math.round(bpm);
    }
  }
  return { title: title, bpm: bpm };
};

const normalizeSongsArray = (songs) => {
  if (!Array.isArray(songs)) {
    return [];
  }
  const out = [];
  for (const s of songs) {
    out.push(normalizeSongEntry(s));
  }
  return out;
};

const normalizeLoadedRecords = (list) => {
  for (const record of list) {
    record.songs = normalizeSongsArray(record.songs);
    if (typeof record.photoFront !== "string") record.photoFront = "";
    if (typeof record.photoBack !== "string") record.photoBack = "";
  }
};

const songsForTemplate = (songs) => {
  const normalized = normalizeSongsArray(songs);
  const out = [];
  for (const s of normalized) {
    out.push({
      title: s.title,
      bpm: s.bpm,
      hasBpm: s.bpm != null,
    });
  }
  return out;
};

const frontCoverUrl = (record) => VinylData.frontCoverUrl(record);

const backCoverUrl = (record) => {
  const u = record.photoBack ? record.photoBack.trim() : "";
  if (u !== "") return u;
  return "";
};

const hidePhotoPreviews = () => {
  const wf = document.querySelector("#wrapPreviewFront");
  const wb = document.querySelector("#wrapPreviewBack");
  if (wf) wf.classList.add("hidden");
  if (wb) wb.classList.add("hidden");
};

const updatePhotoPreviews = (record) => {
  const wf = document.querySelector("#wrapPreviewFront");
  const wb = document.querySelector("#wrapPreviewBack");
  const pf = document.querySelector("#previewPhotoFront");
  const pb = document.querySelector("#previewPhotoBack");
  const front = record.photoFront ? record.photoFront.trim() : "";
  const back = record.photoBack ? record.photoBack.trim() : "";

  if (front !== "") {
    pf.src = front;
    wf.classList.remove("hidden");
  } else {
    wf.classList.add("hidden");
  }

  if (back !== "") {
    pb.src = back;
    wb.classList.remove("hidden");
  } else {
    wb.classList.add("hidden");
  }
};

const clearPhotoPickers = () => {
  document.querySelector("#filePhotoFront").value = "";
  document.querySelector("#filePhotoBack").value = "";
  hidePhotoPreviews();
};

const readOptionalImageFile = (fileInput, callback) => {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    callback(null);
    return;
  }
  const file = fileInput.files[0];
  if (!file.type.startsWith("image/")) {
    window.alert("Please choose an image file (front/back).");
    callback(undefined);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    callback(reader.result);
  };
  reader.readAsDataURL(file);
};

const resolvePhotoField = (previousStored, urlTrimmed, fileDataUrl) => {
  if (fileDataUrl) return fileDataUrl;
  if (urlTrimmed !== "") return urlTrimmed;
  return previousStored || "";
};

const loadRecords = () => {
  vinylRecords = VinylData.loadRecords();
  normalizeLoadedRecords(vinylRecords);
};

const saveRecords = () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vinylRecords));
};

const nextId = () => {
  let max = 0;
  for (const item of vinylRecords) {
    if (item.id > max) {
      max = item.id;
    }
  }
  return max + 1;
};

const findRecordById = (id) => {
  for (const item of vinylRecords) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
};

const findNewestId = (list) => {
  if (list.length === 0) return null;
  const years = list.map((item) => item.year);
  const maxYear = Math.max(...years);
  const newest = list.filter((item) => item.year === maxYear);
  return newest.length > 0 ? newest[0].id : null;
};

const averageYear = (list) => {
  if (list.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const item of list) {
    sum += item.year;
  }
  return Math.round(sum / list.length);
};

const updateStats = () => {
  const statsEl = document.querySelector("#statsBar");
  const total = vinylRecords.length;
  const avg = averageYear(vinylRecords);
  const newestId = findNewestId(vinylRecords);
  let newestTitle = "—";
  for (const item of vinylRecords) {
    if (item.id === newestId) {
      newestTitle = `${item.title} (${item.year})`;
      break;
    }
  }

  statsEl.innerHTML =
    `<span><strong>${total}</strong> records</span>` +
    `<span>Avg. year: <strong>${avg}</strong></span>` +
    `<span>Latest: <strong>${newestTitle}</strong></span>`;
};

const getSearchQuery = () => {
  const input = document.querySelector("#searchInput");
  return input.value.trim().toLowerCase();
};

const filterRecords = (list, query) => {
  if (!query) {
    return list.slice();
  }
  const filtered = [];
  for (const item of list) {
    const haystack =
      `${item.title.toLowerCase()} ${item.artist.toLowerCase()} ${item.genre.toLowerCase()}`;
    if (haystack.includes(query)) {
      filtered.push(item);
    }
  }
  return filtered;
};

const sortRecords = (list, key, direction) => {
  const copy = list.slice();
  copy.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return copy;
};

const refreshRemoveButtonsVisibility = () => {
  const container = document.querySelector("#songRowsContainer");
  const rows = container.querySelectorAll(".song-row");
  const show = rows.length > MIN_SONG_ROWS;
  for (const row of rows) {
    const btn = row.querySelector(".btn-remove-song-row");
    if (btn) btn.classList.toggle("hidden", !show);
  }
};

const createSongRow = (titleValue, bpmValue, showRemoveButton) => {
  const row = document.createElement("div");
  row.className = "song-row";

  const titleLab = document.createElement("label");
  titleLab.className = "song-row-field";
  const titleLblText = document.createElement("span");
  titleLblText.textContent = "Track";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "song-title-input";
  titleInput.placeholder = "Song name";
  titleInput.value = titleValue ? titleValue : "";
  titleLab.appendChild(titleLblText);
  titleLab.appendChild(titleInput);

  const bpmLab = document.createElement("label");
  bpmLab.className = "song-row-field song-row-field--bpm";
  const bpmLblRow = document.createElement("span");
  bpmLblRow.appendChild(document.createTextNode("BPM "));
  const optTag = document.createElement("span");
  optTag.className = "optional-tag";
  optTag.textContent = "optional";
  bpmLblRow.appendChild(optTag);
  bpmLab.appendChild(bpmLblRow);
  const bpmInput = document.createElement("input");
  bpmInput.type = "number";
  bpmInput.className = "song-bpm-input";
  bpmInput.min = "1";
  bpmInput.max = "999";
  bpmInput.placeholder = "—";
  if (bpmValue !== "" && bpmValue !== null && bpmValue !== undefined) {
    bpmInput.value = String(bpmValue);
  }
  bpmLab.appendChild(bpmInput);

  const rm = document.createElement("button");
  rm.type = "button";
  rm.className = "btn btn-remove-song-row";
  rm.textContent = "Remove row";
  rm.setAttribute("aria-label", "Remove this track");
  rm.classList.toggle("hidden", !showRemoveButton);
  rm.addEventListener("click", () => {
    const container = document.querySelector("#songRowsContainer");
    const rows = container.querySelectorAll(".song-row");
    if (rows.length <= MIN_SONG_ROWS) return;
    row.remove();
    refreshRemoveButtonsVisibility();
  });

  row.appendChild(titleLab);
  row.appendChild(bpmLab);
  row.appendChild(rm);
  return row;
};

const populateSongRowsFromRecord = (songs) => {
  const container = document.querySelector("#songRowsContainer");
  container.innerHTML = "";
  const rows = normalizeSongsArray(songs);
  while (rows.length < MIN_SONG_ROWS) {
    rows.push(null);
  }
  for (const s of rows) {
    const title = s ? s.title : "";
    const bpm = s && s.bpm != null ? s.bpm : "";
    container.appendChild(createSongRow(title, bpm, rows.length > MIN_SONG_ROWS));
  }
  refreshRemoveButtonsVisibility();
};

const resetSongRowsDefault = () => {
  populateSongRowsFromRecord([]);
};

const buildSongsFromSongRows = () => {
  const container = document.querySelector("#songRowsContainer");
  const rows = container.querySelectorAll(".song-row");
  const songs = [];
  for (const row of rows) {
    const titleInput = row.querySelector(".song-title-input");
    const bpmInput = row.querySelector(".song-bpm-input");
    const title = titleInput.value.trim();
    if (title === "") continue;
    let bpm = null;
    const bpmRaw = bpmInput.value.trim();
    if (bpmRaw !== "") {
      const n = Number(bpmRaw);
      if (!Number.isNaN(n) && n > 0) {
        bpm = Math.round(n);
      }
    }
    songs.push({ title: title, bpm: bpm });
  }
  return songs;
};

let compiledTemplate = null;

const getTemplate = () => {
  if (compiledTemplate) return compiledTemplate;
  const source = document.querySelector("#vinyl-template").innerHTML;
  compiledTemplate = Handlebars.compile(source);
  return compiledTemplate;
};

const destroyCatalogSwiper = () => {
  if (catalogSwiperInstance) {
    catalogSwiperInstance.destroy(false, false);
    catalogSwiperInstance = null;
  }
};

const initCatalogSwiper = () => {
  const wrapper = document.querySelector("#catalogWrapper");
  const slides = wrapper.querySelectorAll(".swiper-slide");
  if (slides.length === 0) return;

  const pag = document.querySelector(".catalog-pagination");
  pag.innerHTML = "";

  catalogSwiperInstance = new Swiper(".catalogSwiper", {
    slidesPerView: 1.22,
    spaceBetween: 14,
    centeredSlides: true,
    centeredSlidesBounds: true,
    grabCursor: true,
    pagination: {
      el: ".catalog-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".catalog-nav-next",
      prevEl: ".catalog-nav-prev",
    },
    breakpoints: {
      520: { slidesPerView: 1.42, spaceBetween: 18 },
      768: { slidesPerView: 1.58, spaceBetween: 22 },
      1024: { slidesPerView: 1.78, spaceBetween: 26 },
    },
  });
};

const renderCatalog = () => {
  const wrapper = document.querySelector("#catalogWrapper");
  const emptyEl = document.querySelector("#catalogEmpty");
  const swiperEl = document.querySelector(".catalogSwiper");

  destroyCatalogSwiper();

  const query = getSearchQuery();
  let visible = filterRecords(vinylRecords, query);

  const sortKey = document.querySelector("#sortKey").value;
  const sortDir = document.querySelector("#sortDir").value;
  visible = sortRecords(visible, sortKey, sortDir);

  const newestId = findNewestId(vinylRecords);

  if (visible.length === 0) {
    wrapper.innerHTML = "";
    emptyEl.textContent = "Nothing matched.";
    emptyEl.classList.remove("hidden");
    swiperEl.classList.add("hidden");
    return;
  }

  emptyEl.textContent = "";
  emptyEl.classList.add("hidden");
  swiperEl.classList.remove("hidden");

  const rows = visible.map((item) => ({
    ...item,
    isNewest: item.id === newestId,
    frontUrl: frontCoverUrl(item),
    songs: songsForTemplate(item.songs),
  }));

  wrapper.innerHTML = getTemplate()({ vinyls: rows });
  initCatalogSwiper();
};

const setFormMode = (isEditing) => {
  document.querySelector("#formPanelTitle").textContent =
    isEditing ? "Edit record" : "Add record";
  document.querySelector("#formPanelHint").textContent = "";
  document.querySelector("#songRowsHint").textContent =
    isEditing ? "Update tracks as needed." : "Add at least one track.";
  document.querySelector("#formSubmitBtn").textContent =
    isEditing ? "Save" : "Add";
  document.querySelector("#cancelEditBtn").classList.toggle("hidden", !isEditing);
  document.querySelector("#photoEditNote").classList.toggle("hidden", !isEditing);
};

const cancelEdit = () => {
  editingId = null;
  document.querySelector("#addForm").reset();
  resetSongRowsDefault();
  clearPhotoPickers();
  setFormMode(false);
};

const startEdit = (id) => {
  const record = findRecordById(id);
  if (!record) return;

  editingId = id;

  document.querySelector("#fieldTitle").value = record.title;
  document.querySelector("#fieldArtist").value = record.artist;
  document.querySelector("#fieldYear").value = String(record.year);
  document.querySelector("#fieldGenre").value = record.genre;
  document.querySelector("#fieldLabel").value = record.label;

  const pf = record.photoFront ? record.photoFront.trim() : "";
  const pb = record.photoBack ? record.photoBack.trim() : "";
  document.querySelector("#fieldPhotoFront").value =
    pf.indexOf("data:") === 0 ? "" : pf;
  document.querySelector("#fieldPhotoBack").value =
    pb.indexOf("data:") === 0 ? "" : pb;

  document.querySelector("#filePhotoFront").value = "";
  document.querySelector("#filePhotoBack").value = "";

  updatePhotoPreviews(record);
  populateSongRowsFromRecord(record.songs);
  setFormMode(true);

  const formPanel = document.querySelector("#addForm");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

const toggleModalVinylFlip = () => {
  const inner = document.querySelector("#vinylFlipInner");
  const scene = document.querySelector("#vinylFlipScene");
  const hintEl = document.querySelector("#cardModalFlipHint");
  if (scene.classList.contains("hidden")) return;

  const flipped = inner.classList.toggle("is-flipped");
  scene.setAttribute("aria-pressed", flipped ? "true" : "false");
  hintEl.textContent = flipped ? "Back" : "Front";
};

const closeCardModal = () => {
  const modal = document.querySelector("#trackModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("track-modal-open");
};

const openCardModal = (id) => {
  const record = findRecordById(id);
  if (!record) return;

  const modal = document.querySelector("#trackModal");
  const titleEl = document.querySelector("#trackModalTitle");
  const metaEl = document.querySelector("#trackModalMeta");
  const listEl = document.querySelector("#trackModalList");
  const flipScene = document.querySelector("#vinylFlipScene");
  const flipInner = document.querySelector("#vinylFlipInner");
  const singleWrap = document.querySelector("#vinylModalSingle");
  const imgSingle = document.querySelector("#cardModalImgSingle");
  const imgFront = document.querySelector("#cardModalImgFront");
  const imgBack = document.querySelector("#cardModalImgBack");
  const hintRow = document.querySelector("#cardModalFlipHintRow");
  const hintEl = document.querySelector("#cardModalFlipHint");

  flipInner.classList.remove("is-flipped");
  flipScene.setAttribute("aria-pressed", "false");

  const frontSrc = frontCoverUrl(record);
  const backSrc = backCoverUrl(record);

  if (backSrc !== "") {
    flipScene.classList.remove("hidden");
    singleWrap.classList.add("hidden");
    imgFront.src = frontSrc;
    imgFront.alt = `${record.title} front cover`;
    imgBack.src = backSrc;
    imgBack.alt = `${record.title} back cover`;
    hintRow.classList.remove("hidden");
    hintEl.textContent = "Tap to flip";
  } else {
    flipScene.classList.add("hidden");
    singleWrap.classList.remove("hidden");
    imgSingle.src = frontSrc;
    imgSingle.alt = `${record.title} album cover`;
    hintRow.classList.add("hidden");
    hintEl.textContent = "";
  }

  titleEl.textContent = record.title;

  metaEl.innerHTML = "";
  const artistStrong = document.createElement("strong");
  artistStrong.textContent = record.artist;
  metaEl.appendChild(artistStrong);
  metaEl.appendChild(document.createElement("br"));
  const yearSpan = document.createElement("span");
  yearSpan.textContent = String(record.year);
  metaEl.appendChild(yearSpan);
  metaEl.appendChild(
    document.createTextNode(` · ${record.genre} · ${record.label}`)
  );

  listEl.innerHTML = "";
  const normalized = normalizeSongsArray(record.songs);
  for (const s of normalized) {
    const li = document.createElement("li");
    let text = s.title;
    if (s.bpm != null) {
      text += ` — ${s.bpm} BPM`;
    }
    li.textContent = text;
    listEl.appendChild(li);
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("track-modal-open");
};

const wireModal = () => {
  const modal = document.querySelector("#trackModal");

  modal.addEventListener("click", (event) => {
    const t = event.target;
    if (t.hasAttribute("data-close-modal")) {
      closeCardModal();
      return;
    }
    if (t.closest("#vinylFlipScene")) {
      event.preventDefault();
      toggleModalVinylFlip();
    }
  });

  const flipScene = document.querySelector("#vinylFlipScene");
  flipScene.addEventListener("keydown", (event) => {
    if (flipScene.classList.contains("hidden")) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleModalVinylFlip();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!modal.classList.contains("hidden")) {
      closeCardModal();
    }
  });
};

const handleCollectionClick = (event) => {
  const target = event.target;

  if (target.classList.contains("btn-danger")) {
    const idNum = Number(target.dataset.id);
    const idx = vinylRecords.findIndex((item) => item.id === idNum);
    if (idx === -1) return;
    vinylRecords.splice(idx, 1);
    if (editingId === idNum) {
      cancelEdit();
    }
    saveRecords();
    updateStats();
    renderCatalog();
    return;
  }

  if (target.classList.contains("btn-edit")) {
    startEdit(Number(target.dataset.editId));
    return;
  }

  const card = target.closest(".card-expand-hit");
  if (card) {
    openCardModal(Number(card.dataset.expandId));
  }
};

const handleCardExpandKeydown = (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const hit = event.target.closest(".card-expand-hit");
  if (!hit) return;
  if (!hit.contains(event.target)) return;
  event.preventDefault();
  openCardModal(Number(hit.dataset.expandId));
};

const handleAddSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const year = Number(formData.get("year"));
  const genre = String(formData.get("genre") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const urlFront = String(formData.get("photoFront") || "").trim();
  const urlBack = String(formData.get("photoBack") || "").trim();

  const songs = buildSongsFromSongRows();

  if (!title || !artist || !genre || !label || songs.length === 0) {
    window.alert("Please fill every required album field and at least one track title.");
    return;
  }

  if (Number.isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
    window.alert(`Please enter a valid year between ${MIN_YEAR} and ${MAX_YEAR}.`);
    return;
  }

  const fileFrontEl = document.querySelector("#filePhotoFront");
  const fileBackEl = document.querySelector("#filePhotoBack");
  const existing = editingId != null ? findRecordById(editingId) : null;
  const prevFront = existing ? existing.photoFront || "" : "";
  const prevBack = existing ? existing.photoBack || "" : "";

  readOptionalImageFile(fileFrontEl, (frontFileData) => {
    if (frontFileData === undefined) return;

    readOptionalImageFile(fileBackEl, (backFileData) => {
      if (backFileData === undefined) return;

      const photoFront = resolvePhotoField(prevFront, urlFront, frontFileData);
      const photoBack = resolvePhotoField(prevBack, urlBack, backFileData);

      if (editingId != null) {
        const rec = findRecordById(editingId);
        if (rec) {
          rec.title = title;
          rec.artist = artist;
          rec.year = year;
          rec.genre = genre;
          rec.label = label;
          rec.songs = songs;
          rec.photoFront = photoFront;
          rec.photoBack = photoBack;
          saveRecords();
          updateStats();
          cancelEdit();
          renderCatalog();
          return;
        }
        window.alert("That record is no longer in your collection.");
        cancelEdit();
        renderCatalog();
        return;
      }

      vinylRecords.push({
        id: nextId(),
        title: title,
        artist: artist,
        year: year,
        genre: genre,
        label: label,
        photoFront: photoFront,
        photoBack: photoBack,
        songs: songs,
      });

      saveRecords();
      updateStats();
      renderCatalog();
      form.reset();
      resetSongRowsDefault();
      clearPhotoPickers();
      setFormMode(false);
    });
  });
};

const wireEvents = () => {
  document.querySelector("#addForm").addEventListener("submit", handleAddSubmit);

  document.querySelector("#cancelEditBtn").addEventListener("click", () => {
    cancelEdit();
  });

  document.querySelector("#addSongRowBtn").addEventListener("click", () => {
    const container = document.querySelector("#songRowsContainer");
    container.appendChild(createSongRow("", "", true));
    refreshRemoveButtonsVisibility();
  });

  const collectionSection = document.querySelector(".collection-section");
  collectionSection.addEventListener("click", handleCollectionClick);
  collectionSection.addEventListener("keydown", handleCardExpandKeydown);

  document.querySelector("#searchInput").addEventListener("input", renderCatalog);
  document.querySelector("#applySort").addEventListener("click", renderCatalog);
  document.querySelector("#sortKey").addEventListener("change", renderCatalog);
  document.querySelector("#sortDir").addEventListener("change", renderCatalog);
};

loadRecords();
updateStats();
wireEvents();
wireModal();
setFormMode(false);
resetSongRowsDefault();
renderCatalog();
