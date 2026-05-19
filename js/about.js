/**
 * About page: FAQ accordion; guestbook comments (array of objects, Handlebars,
 * newest first, localStorage persistence).
 */

const COMMENTS_STORAGE_KEY = "vinylBoxAboutComments";

/** @type {{ name: string, message: string, postedAt: number }[]} */
let comments = [];

let compiledCommentsTemplate = null;

const setupAccordion = () => {
  const buttons = document.querySelectorAll(".accordion-toggle");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const key = btn.dataset.acc;
      const panel = document.querySelector(`#accPanel${key}`);
      const icon = btn.querySelector("span");

      if (!panel) return;

      const isOpen = panel.classList.toggle("is-open");
      if (icon) {
        icon.textContent = isOpen ? "−" : "+";
      }
    });
  }
};

const loadComments = () => {
  const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      comments = Array.isArray(parsed) ? parsed : [];
    } catch {
      comments = [];
    }
    return;
  }

  comments = [
    {
      name: "Alice",
      message: "Nice layout.",
      postedAt: Date.now() - 86400000,
    },
    {
      name: "John",
      message: "Works well.",
      postedAt: Date.now() - 172800000,
    },
  ];
  saveComments();
};

const saveComments = () => {
  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
};

const commentsNewestFirst = (list) => {
  const copy = list.slice();
  copy.sort((a, b) => {
    const ta = typeof a.postedAt === "number" ? a.postedAt : 0;
    const tb = typeof b.postedAt === "number" ? b.postedAt : 0;
    return tb - ta;
  });
  return copy;
};

const renderComments = () => {
  const host = document.querySelector("#commentsHost");
  if (!host || !compiledCommentsTemplate) return;

  const ordered = commentsNewestFirst(comments);
  host.innerHTML = compiledCommentsTemplate({ comments: ordered });
};

const setupCommentsForm = () => {
  const form = document.querySelector("#commentForm");
  const tplEl = document.querySelector("#comments-template");
  if (!form || !tplEl || typeof Handlebars === "undefined") return;

  compiledCommentsTemplate = Handlebars.compile(tplEl.innerHTML);

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const nameInput = document.querySelector("#commentName");
    const messageInput = document.querySelector("#commentMessage");
    if (!nameInput || !messageInput) return;

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!name || !message) return;

    comments.push({
      name: name,
      message: message,
      postedAt: Date.now(),
    });
    saveComments();
    renderComments();
    form.reset();
    nameInput.focus();
  });

  loadComments();
  renderComments();
};

const setupBioToggle = () => {
  const btn = document.querySelector("#bioToggleBtn");
  const extended = document.querySelector("#bioExtended");
  if (!btn || !extended) return;

  btn.addEventListener("click", () => {
    const isExpanded = btn.dataset.expanded === "true";
    if (isExpanded) {
      extended.classList.add("hidden");
      extended.setAttribute("aria-hidden", "true");
      btn.textContent = "Read more";
      btn.dataset.expanded = "false";
      btn.setAttribute("aria-expanded", "false");
    } else {
      extended.classList.remove("hidden");
      extended.setAttribute("aria-hidden", "false");
      btn.textContent = "Read less";
      btn.dataset.expanded = "true";
      btn.setAttribute("aria-expanded", "true");
    }
  });
};

setupAccordion();
setupCommentsForm();
setupBioToggle();
