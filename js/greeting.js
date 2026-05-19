/**
 * Time-based welcome greeting — loaded directly after #greeting in index.html.
 */
(() => {
  const GREETING_DELAY_MS = 400;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return `Good morning — glad you're here. Take your time on the shelf.`;
    }
    if (hour < 18) {
      return `Good afternoon — hope you're having a good one. Your collection is ready when you are.`;
    }
    return `Good evening — glad you stopped by. Dig through the records at your own pace.`;
  };

  const applyGreeting = () => {
    const el = document.querySelector("#greeting");
    if (!el) {
      return;
    }

    el.textContent = "…";
    el.classList.remove("greeting--ready");

    window.setTimeout(() => {
      el.textContent = getWelcomeMessage();
      el.classList.add("greeting--ready");
    }, GREETING_DELAY_MS);
  };

  applyGreeting();
  window.applyVinylGreeting = applyGreeting;
})();
