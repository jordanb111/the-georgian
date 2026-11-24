// The Georgian: nav, reveal, hero slideshow, floor plan tabs, tour inquiry form.
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  function closeNav() {
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) { closeNav(); navToggle.focus(); }
  });
  mainNav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- hero slideshow: 10s cross-fade ---------- */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dot");
  var current = 0, timer = null;
  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
    dots.forEach(function (d, n) { d.setAttribute("aria-current", n === current ? "true" : "false"); });
  }
  function stop() { clearInterval(timer); timer = null; }
  function play() { stop(); timer = setInterval(function () { show(current + 1); }, 10000); }
  if (slides.length > 1) {
    dots.forEach(function (d, n) { d.addEventListener("click", function () { show(n); play(); }); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : play(); });
    play();
  }

  /* ---------- floor plan tabs (arrow keys move between tabs) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      var next = tabs[(i + d + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* ---------- inquiry form ---------- */
  var form = document.getElementById("inquiry-form");
  var statusEl = document.getElementById("form-status");
  var successPanel = document.getElementById("form-success");
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.textContent;

  // "Request a Tour" on a floor plan preselects that unit type.
  document.querySelectorAll("[data-unit]").forEach(function (a) {
    a.addEventListener("click", function () { form.elements.unitPreference.value = a.getAttribute("data-unit"); });
  });

  // Tours start tomorrow at the earliest (local date, not UTC).
  var t = new Date();
  t.setDate(t.getDate() + 1);
  form.elements.tourDate.min = [t.getFullYear(), String(t.getMonth() + 1).padStart(2, "0"), String(t.getDate()).padStart(2, "0")].join("-");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.className = "form-status";
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    })
      .then(function (res) {
        return res.json().then(function (j) {
          if (!res.ok || String(j.success) !== "true") throw new Error(j.message || "HTTP " + res.status);
        });
      })
      .then(function () {
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.focus();
      })
      .catch(function () {
        statusEl.textContent = "We couldn’t send that just now. Please try again, or email manager@cottagerosepm.com.";
        statusEl.className = "form-status is-visible";
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      });
  });
})();
