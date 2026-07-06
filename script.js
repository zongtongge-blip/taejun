(function () {
  var root = document.documentElement;
  var stage = document.querySelector(".scroll-stage");
  var toggleBtn = document.getElementById("theme-toggle");
  var toggleTranslation = document.getElementById("theme-toggle-translation");
  var storageKey = "theme";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    var progress = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * progress;
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    toggleBtn.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
    toggleTranslation.textContent = theme === "dark"
      ? "(淺色模式 / Light Mode)"
      : "(深色模式 / Dark Mode)";
    localStorage.setItem(storageKey, theme);
  }

  function initTheme() {
    var savedTheme = localStorage.getItem(storageKey);
    setTheme(savedTheme === "dark" ? "dark" : "light");

    toggleBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  function updateScrollScene() {
    if (!stage || reduceMotion) {
      root.style.setProperty("--detail-opacity", "1");
      root.style.setProperty("--detail-y", "0px");
      return;
    }

    var rect = stage.getBoundingClientRect();
    var maxScroll = stage.offsetHeight - window.innerHeight;
    var progress = clamp(-rect.top / maxScroll, 0, 1);

    var flip = mapRange(progress, 0.18, 0.48, 0, 180);
    var tiltX = mapRange(progress, 0, 0.58, 10, 0);
    var tiltZ = mapRange(progress, 0, 0.58, -7, 0);
    var scale = mapRange(progress, 0.48, 0.74, 1, 2.15);
    var cardY = mapRange(progress, 0.48, 0.74, 0, 85);
    var cardPink = mapRange(progress, 0.08, 0.48, 0, 1);
    var detailOpacity = mapRange(progress, 0.64, 0.82, 0, 1);
    var detailY = mapRange(progress, 0.64, 0.82, 40, 0);

    root.style.setProperty("--flip", flip.toFixed(2) + "deg");
    root.style.setProperty("--tilt-x", tiltX.toFixed(2) + "deg");
    root.style.setProperty("--tilt-z", tiltZ.toFixed(2) + "deg");
    root.style.setProperty("--card-scale", scale.toFixed(3));
    root.style.setProperty("--card-y", cardY.toFixed(2) + "px");
    root.style.setProperty("--card-pink", cardPink.toFixed(3));
    root.style.setProperty("--detail-opacity", detailOpacity.toFixed(3));
    root.style.setProperty("--detail-y", detailY.toFixed(2) + "px");
  }

  function onScroll() {
    window.requestAnimationFrame(updateScrollScene);
  }

  initTheme();
  updateScrollScene();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollScene);
})();
