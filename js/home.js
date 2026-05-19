/**
 * Welcome page scripts:
 * 1) Time-based greeting — see greeting.js (loaded next to #greeting in index.html)
 * 2) Button pulse animation + link to catalog
 * 3) Featured carousel rendered via Handlebars (custom "upper" helper)
 * 4) Initialise Swiper (third-party plugin)
 */

Handlebars.registerHelper("upper", (text) => String(text).toUpperCase());

const FEATURED_COUNT = 3;
let compiledFeaturedTemplate = null;

const getFeaturedTemplate = () => {
  if (compiledFeaturedTemplate) return compiledFeaturedTemplate;
  if (typeof Handlebars === "undefined") return null;
  const tplEl = document.querySelector("#featured-template");
  if (!tplEl) return null;
  compiledFeaturedTemplate = Handlebars.compile(tplEl.innerHTML);
  return compiledFeaturedTemplate;
};

const buildFeaturedSlides = () => {
  const wrapper = document.querySelector(".featuredSwiper .swiper-wrapper");
  if (!wrapper || typeof VinylData === "undefined") {
    return 0;
  }

  const records = VinylData.loadRecords();
  const picks = records.slice(0, FEATURED_COUNT);

  const tpl = getFeaturedTemplate();
  if (!tpl) {
    wrapper.innerHTML = "";
    return 0;
  }

  const cards = picks.map((record) => ({
    title: record.title,
    genre: record.genre,
    year: record.year,
    frontUrl: VinylData.frontCoverUrl(record),
  }));

  wrapper.innerHTML = tpl({ records: cards });
  return cards.length;
};

const setupCtaPulse = () => {
  const btn = document.querySelector("#ctaPulse");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", () => {
    btn.classList.remove("pulse-once");
    void btn.offsetWidth;
    btn.classList.add("pulse-once");
    window.setTimeout(() => {
      window.location.href = "catalog.html";
    }, 450);
  });
};

const setupSwiper = (slideCount) => {
  if (typeof Swiper === "undefined" || slideCount === 0) {
    return;
  }

  const el = document.querySelector(".featuredSwiper");
  if (!el || el.swiper) {
    return;
  }

  new Swiper(".featuredSwiper", {
    loop: slideCount > 1,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".featuredSwiper .swiper-pagination",
      clickable: true,
    },
  });
};

const initWelcomePage = () => {
  if (typeof window.applyVinylGreeting === "function") {
    window.applyVinylGreeting();
  }
  const slideCount = buildFeaturedSlides();
  setupCtaPulse();
  setupSwiper(slideCount);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWelcomePage);
} else {
  initWelcomePage();
}
