"use strict";
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const t = (key) => window.WEDDING_I18N.t(key);
const WEDDING = {
  // The countdown runs to the wedding ceremony at the groom's home.
  date: "2026-11-17T09:00:00+07:00",
  events: [
    {
      uid: "dinh-hon",
      start: "2026-11-16T08:00:00+07:00",
      title: "Lễ đính hôn Tiến Du & Hương Giang",
      location:
        "Tư gia nhà gái, Số nhà 4, Tổ 1, Ngõ 230 An Dương Vương, P. Thống Nhất, Phú Thọ",
    },
    {
      uid: "tiec-nha-gai",
      start: "2026-11-16T10:30:00+07:00",
      title: "Tiệc cưới nhà gái · Hương Giang & Tiến Du",
      location:
        "Trung tâm giải trí Sao Mai, Số 3 An Dương Vương, Tổ 4, P. Hòa Bình, Phú Thọ",
    },
    {
      uid: "thanh-hon",
      start: "2026-11-17T09:00:00+07:00",
      title: "Lễ thành hôn Tiến Du & Hương Giang",
      location: "Tư gia nhà trai, 659 An Dương Vương, P. Thống Nhất, Phú Thọ",
    },
    {
      uid: "tiec-nha-trai",
      start: "2026-11-17T10:30:00+07:00",
      title: "Tiệc cưới nhà trai · Tiến Du & Hương Giang",
      location:
        "Trung tâm giải trí Sao Mai, Số 3 An Dương Vương, Tổ 4, P. Hòa Bình, Phú Thọ",
    },
  ],
};
let toastTimer;
function toast(messageKey) {
  $("#toast").dataset.i18n = messageKey;
  $("#toast").textContent = t(messageKey);
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 5000);
}
function readStorage(kind, key) {
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(kind, key, value) {
  try {
    window[kind].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// Explicit pause wins over all automatic retries. A browser may require a gesture.
const audio = $("#background-music");
const musicButton = $("#music-toggle");
const musicKey = "du-giang-music-enabled-v1";
const positionKey = "du-giang-music-position-v1";
let musicEnabled = readStorage("localStorage", musicKey) !== "false";
let starting = false;
let audioFailed = false;
let musicBlocked = false;
audio.volume = 0.4;
audio.autoplay = musicEnabled;
function musicState(playing, blocked = false) {
  musicBlocked = blocked;
  musicButton.classList.toggle("is-playing", playing);
  musicButton.setAttribute("aria-pressed", String(playing));
  musicButton.setAttribute(
    "aria-label",
    playing ? t("music.pause") : t("music.play"),
  );
  $("#music-status").textContent = audioFailed
    ? t("music.error")
    : blocked
      ? t("music.blocked")
      : playing
        ? t("music.playing")
        : t("music.paused");
}
async function startMusic() {
  if (!musicEnabled || starting || !audio.paused) return;
  starting = true;
  try {
    await audio.play();
    if (!musicEnabled) audio.pause();
  } catch (error) {
    if (error.name === "NotAllowedError") musicState(false, true);
    else if (error.name !== "AbortError") {
      audioFailed = true;
      musicState(false);
    }
  } finally {
    starting = false;
  }
}
audio.addEventListener("loadedmetadata", () => {
  const last = Number(readStorage("sessionStorage", positionKey));
  if (Number.isFinite(last) && last > 0 && last < audio.duration - 1)
    audio.currentTime = last;
  startMusic();
});
audio.addEventListener("playing", () => {
  audioFailed = false;
  if (!musicEnabled) audio.pause();
  else musicState(true);
});
audio.addEventListener("pause", () => musicState(false));
audio.addEventListener("error", () => {
  audioFailed = true;
  musicState(false);
});
audio.addEventListener("canplay", startMusic);
let savedAt = 0;
audio.addEventListener("timeupdate", () => {
  if (Date.now() - savedAt > 2000) {
    writeStorage("sessionStorage", positionKey, String(audio.currentTime));
    savedAt = Date.now();
  }
});
window.addEventListener("pagehide", () =>
  writeStorage("sessionStorage", positionKey, String(audio.currentTime)),
);
musicButton.addEventListener("click", () => {
  if (!audio.paused) {
    musicEnabled = false;
    audio.pause();
  } else {
    musicEnabled = true;
    audioFailed = false;
    if (audio.error) audio.load();
    startMusic();
  }
  writeStorage("localStorage", musicKey, String(musicEnabled));
});
function unlockMusic(event) {
  if (event.target instanceof Element && event.target.closest("#music-toggle"))
    return;
  startMusic();
}
["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach((event) =>
  document.addEventListener(event, unlockMusic, { passive: true }),
);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && musicEnabled) startMusic();
});
if (musicEnabled) startMusic();
else musicState(false);

const motion = matchMedia("(prefers-reduced-motion: reduce)");
let countdownInterval;
function countdown() {
  const remaining = Math.max(0, new Date(WEDDING.date).getTime() - Date.now());
  const units = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60,
  };
  Object.entries(units).forEach(
    ([key, value]) =>
      ($(`#${key}`).textContent = String(value).padStart(2, "0")),
  );
  if (!remaining) {
    $("#countdown-title").dataset.i18n = "countdown.arrived";
    $("#countdown-title").textContent = t("countdown.arrived");
    clearInterval(countdownInterval);
  }
}
countdownInterval = setInterval(countdown, 1000);
countdown();
const guest = new URLSearchParams(location.search).get("to");
if (guest && guest.trim()) {
  $("#guest-dedication").dataset.personalized = "true";
  $("#guest-dedication").textContent = guest.trim().slice(0, 100);
}

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("modal-open");
}
$$("dialog").forEach((dialog) => {
  $("[data-close]", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () =>
    document.body.classList.remove("modal-open"),
  );
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
});
const photos = $$(".gallery-item");
const lightbox = $("#lightbox");
let photoIndex = 0;
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const original = $("img", photos[photoIndex]);
  $("#lightbox-image").src = original.src;
  $("#lightbox-image").alt = original.alt;
  $("#lightbox-caption").textContent = photos[photoIndex].dataset.caption;
  $("#lightbox-counter").textContent =
    `${String(photoIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
}
photos.forEach((photo, index) =>
  photo.addEventListener("click", () => {
    showPhoto(index);
    openDialog(lightbox);
  }),
);
$(".lightbox-prev").addEventListener("click", () => showPhoto(photoIndex - 1));
$(".lightbox-next").addEventListener("click", () => showPhoto(photoIndex + 1));
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    showPhoto(photoIndex + (event.key === "ArrowRight" ? 1 : -1));
  }
});
let swipe = null;
lightbox.addEventListener(
  "touchstart",
  (event) => {
    swipe =
      event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
  },
  { passive: true },
);
lightbox.addEventListener(
  "touchend",
  (event) => {
    if (!swipe) return;
    const dx = event.changedTouches[0].clientX - swipe.x;
    const dy = event.changedTouches[0].clientY - swipe.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
      showPhoto(photoIndex + (dx < 0 ? 1 : -1));
    swipe = null;
  },
  { passive: true },
);
function icsText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function icsDate(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
function foldLine(line) {
  const encoder = new TextEncoder();
  let current = "",
    bytes = 0;
  const output = [];
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 73) {
      output.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  output.push(current);
  return output.join("\r\n");
}
$("#save-date").addEventListener("click", () => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DuGiang//Wedding//VI",
    "CALSCALE:GREGORIAN",
    ...WEDDING.events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:du-giang-${event.uid}@wedding.local`,
      `DTSTAMP:${icsDate(Date.now())}`,
      `DTSTART:${icsDate(event.start)}`,
      `SUMMARY:${icsText(event.title)}`,
      `LOCATION:${icsText(event.location)}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(t("calendar.reminder"))}`,
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(
    new Blob([lines.map(foldLine).join("\r\n") + "\r\n"], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "Tien-Du-Huong-Giang-16-17-11-2026.ics";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast("calendar.saved");
});
// The short domain serves this page with a <base> pointing at GitHub Pages, so an
// in-page hash link and a cross-origin download attribute both need scripted handling.
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("#main").setAttribute("tabindex", "-1");
  $("#main").focus();
});
$("#gift-save").addEventListener("click", async (event) => {
  event.preventDefault();
  const { href, download } = event.currentTarget;
  try {
    const response = await fetch(href);
    if (!response.ok) throw new Error("QR unavailable");
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = download;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    window.open(href, "_blank", "noopener");
  }
});

// Gift boxes only ever show the QR images configured in rsvp-config.js.
const giftDialog = $("#gift-dialog");
$$("[data-gift]").forEach((box) =>
  box.addEventListener("click", () => {
    const side = box.dataset.gift;
    const qr = window.WEDDING_GIFTS?.[side];
    $("#gift-title").textContent = side === "groom" ? "Nhà Trai" : "Nhà Gái";
    $("#gift-qr").hidden = !qr;
    $("#gift-save").hidden = !qr;
    if (qr) {
      $("#gift-qr").src = qr;
      $("#gift-qr").alt = `Mã QR mừng cưới ${$("#gift-title").textContent}`;
      $("#gift-save").href = qr;
      $("#gift-save").download = `QR-mung-cuoi-${side === "groom" ? "nha-trai" : "nha-gai"}.jpg`;
    }
    $("#gift-note").hidden = Boolean(qr);
    $("#gift-note").textContent = t("gift.pending");
    openDialog(giftDialog);
  }),
);

const form = $("#rsvp-form");
const receipt = $("#google-rsvp");
const receiptFrame = $("#google-rsvp-frame");
const sendButton = form.querySelector('button[type="submit"]');
const rsvpResult = $("#rsvp-result");
let rsvpTarget = null;
let sendingRsvp = false;
let deliveryTimer;
function setRsvpStatus(key) {
  rsvpResult.dataset.i18n = key;
  rsvpResult.textContent = t(key);
}
form.hidden = false;

// Post the styled form through a normal browser navigation. The visible Google
// response is the receipt; an iframe load alone is never treated as success.
try {
  const config = window.WEDDING_RSVP;
  const url = new URL(config?.formUrl);
  const entries = config?.entries;
  if (
    url.protocol === "https:" &&
    url.hostname === "docs.google.com" &&
    !url.username &&
    !url.password &&
    !url.port &&
    /^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform\/?$/.test(url.pathname) &&
    ["name", "side", "attendance", "guests", "wish"].every((key) =>
      /^entry\.\d+$/.test(entries?.[key]),
    )
  ) {
    url.search = "";
    url.hash = "";
    $("#google-rsvp-link").href = url.href;
    url.pathname = url.pathname.replace(/viewform\/?$/, "formResponse");
    url.searchParams.set("embedded", "true");
    rsvpTarget = { url: url.href, entries };
  }
} catch {
  /* An invalid configuration must not send guest details elsewhere. */
}
if (!rsvpTarget) {
  sendButton.disabled = true;
  rsvpResult.hidden = false;
  setRsvpStatus("rsvp.unavailable");
}

function updateAttendance() {
  const coming = form.elements.attendance.value === "yes";
  $(".guest-count-wrap").hidden = !coming;
  $("#guest-count").disabled = !coming;
}
$$('input[name="attendance"]').forEach((input) =>
  input.addEventListener("change", updateAttendance),
);
$("#guest-name").addEventListener("input", () =>
  $("#guest-name").setCustomValidity(""),
);
$("#guest-name").addEventListener("invalid", (event) => {
  if (!event.target.value.trim())
    event.target.setCustomValidity(t("rsvp.requiredName"));
});
const sideInputs = $$('input[name="side"]');
sideInputs.forEach((input) => {
  input.addEventListener("invalid", () => {
    if (input.validity.valueMissing)
      input.setCustomValidity(t("rsvp.requiredSide"));
  });
  input.addEventListener("change", () => {
    sideInputs.forEach((sideInput) => sideInput.setCustomValidity(""));
  });
});

function finishDeliveryView() {
  if (!sendingRsvp) return;
  clearTimeout(deliveryTimer);
  sendingRsvp = false;
  receipt.removeAttribute("aria-busy");
  setRsvpStatus("rsvp.result");
  receipt.classList.add("is-visible");
  receipt.scrollIntoView({
    behavior: motion.matches ? "instant" : "smooth",
    block: "center",
  });
  // Require a deliberate edit before allowing another submission.
}
receiptFrame.addEventListener("load", finishDeliveryView);
form.addEventListener("input", () => {
  if (rsvpTarget && !sendingRsvp) sendButton.disabled = false;
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!rsvpTarget || sendingRsvp) return;
  const name = $("#guest-name").value.trim();
  if (!name) {
    $("#guest-name").setCustomValidity(t("rsvp.requiredName"));
    $("#guest-name").reportValidity();
    return;
  }
  if (!form.reportValidity()) return;
  if (!navigator.onLine) {
    rsvpResult.hidden = false;
    setRsvpStatus("rsvp.offline");
    return;
  }
  const coming = form.elements.attendance.value === "yes";
  // Use stable Vietnamese values in both languages to match the Google Form.
  const side =
    form.elements.side.value === "bride" ? "Khách nhà gái" : "Khách nhà trai";
  const wish = $("#guest-wish").value.trim();
  const payload = {
    [rsvpTarget.entries.name]: name,
    [rsvpTarget.entries.attendance]: coming
      ? "Mình sẽ tham dự!"
      : "Tiếc quá! Mình không tham dự được mất rồi!",
    [rsvpTarget.entries.side]: side,
    [rsvpTarget.entries.wish]: wish,
    fvv: "1",
    pageHistory: "0",
  };
  if (coming) payload[rsvpTarget.entries.guests] = $("#guest-count").value;
  const deliveryForm = document.createElement("form");
  deliveryForm.method = "POST";
  const postUrl = new URL(rsvpTarget.url);
  postUrl.searchParams.set("hl", window.WEDDING_I18N.language);
  deliveryForm.action = postUrl.href;
  deliveryForm.target = receiptFrame.name;
  deliveryForm.acceptCharset = "UTF-8";
  deliveryForm.hidden = true;
  for (const [key, value] of Object.entries(payload)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    deliveryForm.append(input);
  }
  document.body.append(deliveryForm);
  sendingRsvp = true;
  sendButton.disabled = true;
  receipt.hidden = false;
  receipt.classList.add("is-visible");
  receipt.setAttribute("aria-busy", "true");
  rsvpResult.hidden = false;
  setRsvpStatus("rsvp.sending");
  deliveryTimer = setTimeout(() => {
    sendingRsvp = false;
    receipt.removeAttribute("aria-busy");
    sendButton.disabled = false;
    setRsvpStatus("rsvp.timeout");
  }, 30000);
  HTMLFormElement.prototype.submit.call(deliveryForm);
  deliveryForm.remove();
});
updateAttendance();

function refreshLocalizedState() {
  musicState(!audio.paused, musicBlocked);
  if (rsvpTarget) {
    const helpUrl = new URL(window.WEDDING_RSVP.formUrl);
    helpUrl.searchParams.set("hl", window.WEDDING_I18N.language);
    $("#google-rsvp-link").href = helpUrl.href;
  }
}
refreshLocalizedState();
