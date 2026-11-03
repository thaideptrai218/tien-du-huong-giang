"use strict";

(() => {
  const root = document.documentElement;
  const loader = document.querySelector("#page-loader");
  const emblem = loader.querySelector(".loader-emblem");
  const main = document.querySelector("main");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const revealTargets = new Set(document.querySelectorAll(".reveal"));
  let observer;
  let ready = false;
  let finishing = false;

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    root.classList.add("motion-ready");
  }

  function show(element) {
    element.classList.add("is-visible");
    observer?.unobserve(element);
  }

  function startReveals() {
    if (ready) return;
    ready = true;
    main.removeAttribute("aria-busy");
    if (!root.classList.contains("motion-ready")) return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    requestAnimationFrame(() => {
      for (const element of revealTargets) observer.observe(element);
    });
  }
  document.addEventListener("wedding:ready", startReveals, { once: true });
  // Keyboard navigation must never land on an invisible link or form.
  document.addEventListener("focusin", (event) => {
    let element = event.target.closest(".reveal");
    while (element) {
      show(element);
      element = element.parentElement?.closest(".reveal");
    }
  });
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      root.classList.remove("motion-ready");
      observer?.disconnect();
    }
  });

  function unveil() {
    if (!root.classList.contains("is-loading")) {
      startReveals();
      return;
    }
    clearTimeout(window.weddingBootTimer);
    emblem.classList.add("is-finished");
    root.classList.add("is-unveiling");
    root.classList.remove("is-loading");
    document.dispatchEvent(new Event("wedding:ready"));
    setTimeout(
      () => {
        loader.hidden = true;
        root.classList.remove("is-unveiling");
      },
      reducedMotion.matches ? 0 : 650,
    );
  }

  function finishOnLogo() {
    if (finishing) return;
    finishing = true;
    if (reducedMotion.matches || document.hidden) {
      unveil();
      return;
    }
    // End at the complete monogram, rather than halfway through its dot phase.
    const monogram = loader.querySelector(".loader-monogram");
    const fallback = setTimeout(complete, 2200);
    function complete() {
      clearTimeout(fallback);
      monogram.removeEventListener("animationiteration", complete);
      unveil();
    }
    monogram.addEventListener("animationiteration", complete, { once: true });
  }

  // Hearts drift down the invitation; decorative, so skipped for reduced motion.
  if (!reducedMotion.matches) {
    const layer = document.querySelector("#hearts");
    for (let i = 0; i < 16; i++) {
      const heart = document.createElement("i");
      heart.style.left = `${(i * 6.25 + Math.random() * 6).toFixed(1)}%`;
      heart.style.setProperty("--size", `${(7 + Math.random() * 7).toFixed(1)}px`);
      heart.style.setProperty("--sway", `${(Math.random() * 44 - 22).toFixed(0)}px`);
      heart.style.animationDuration = `${(11 + Math.random() * 10).toFixed(1)}s`;
      heart.style.animationDelay = `${(-Math.random() * 20).toFixed(1)}s`;
      layer.append(heart);
    }
  }

  function imageReady(image) {
    image.loading = "eager";
    return image.decode();
  }

  if (!root.classList.contains("is-loading")) {
    startReveals();
    return;
  }
  main.setAttribute("aria-busy", "true");
  const pageLoaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) =>
          window.addEventListener("load", resolve, { once: true }),
        );
  const assets = [
    pageLoaded.then(() => document.fonts?.ready),
    // Wait only for the first screen; the album lazy-loads while guests scroll.
    ...[...document.querySelectorAll('img[fetchpriority="high"]')].map(imageReady),
  ];
  const timeout = setTimeout(finishOnLogo, 8000);
  Promise.allSettled(assets).then(() => {
    clearTimeout(timeout);
    finishOnLogo();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      clearTimeout(timeout);
      clearTimeout(window.weddingBootTimer);
      root.classList.remove("is-loading", "is-unveiling");
      loader.hidden = true;
      startReveals();
    }
  });
})();
