/*
  MOHAMMED UMAR — CONTINUOUS PIXEL DESERT PORTFOLIO
  One long page, one centralized state controller.
*/

const dino = document.getElementById("dino");
const progressBar = document.getElementById("scrollProgress");
const techTrack = document.getElementById("techTrack");
const techWindow = document.getElementById("techWindow");
const techItems = [...document.querySelectorAll(".tech-item")];
const projects = [...document.querySelectorAll(".project")];
const skillImage = document.getElementById("skillImage");
const skillNumber = document.getElementById("skillNumber");
const skillTitle = document.getElementById("skillTitle");
const skillDescription = document.getElementById("skillDescription");
const skillDots = [...document.querySelectorAll("#skillDots span")];
const techCounter = document.getElementById("techCounter");
const projectCounter = document.getElementById("projectCounter");
const form = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const navLinks = [...document.querySelectorAll("[data-nav]")];
const sections = [...document.querySelectorAll("[data-chapter]")];

const SKILLS = [
  {
    title: "CODING",
    icon: "assets/coding.png",
    desc: "Building interactive experiences with AI, machine learning, and modern web technologies. I enjoy turning ideas into practical, functional products through code."
  },
  {
    title: "DESIGN",
    icon: "assets/designer.png",
    desc: "Creating clean and intuitive interfaces with thoughtful layouts, visual systems, and pixel-perfect details that make digital experiences simple and enjoyable."
  },
  {
    title: "ANIMATION",
    icon: "assets/animator.png",
    desc: "Bringing ideas to life through motion, playful interactions, and visual storytelling while adding personality and energy to digital experiences."
  }
];

const TECH_NAMES = [
  "PYTHON", "JAVA", "JAVASCRIPT", "HTML", "CSS", "REACT",
  "NODE.JS", "FIGMA", "FLASK", "MYSQL", "GIT", "GITHUB"
];

/*
  22 navigable states:
  Home + About + 3 skills + 12 technologies + 2 projects
  + OpsPilot + Achievements + Contact.
*/
const STATES = [
  { type: "chapter", id: "home" },
  { type: "chapter", id: "about" },
  ...SKILLS.map((_, index) => ({ type: "skill", index })),
  ...TECH_NAMES.map((_, index) => ({ type: "tech", index })),
  { type: "project", index: 0 },
  { type: "project", index: 1 },
  { type: "chapter", id: "currently-working" },
  { type: "chapter", id: "achievements" },
  { type: "chapter", id: "contact" }
];

const state = {
  index: 0,
  locked: false,
  touchStartY: 0,
  touchStartX: 0,
  lastWheelAt: 0,
  scrollRaf: 0
};

const WHEEL_COOLDOWN = 440;
const WHEEL_THRESHOLD = 22;
const TOUCH_THRESHOLD = 45;

const DINO_PRESETS = {
  home:             { x: 50, y: 77, size: 145, flip: 1 },
  about:            { x: 20, y: 57, size: 460, flip: 1 },

  skill0:           { x: 14, y: 82, size: 122, flip: 1 },
  skill1:           { x: 50, y: 82, size: 122, flip: 1 },
  skill2:           { x: 86, y: 82, size: 122, flip: 1 },

  tech:             { x: 50, y: 78, size: 108, flip: 1 },

  work:             { x: 20, y: 57, size: 460, flip: 1 },

  "currently-working": { x: 85, y: 57, size: 520, flip: -1 },

  achievements:     { x: 50, y: 76, size: 118, flip: 1 },

  contact:          { x: 20, y: 57, size: 460, flip: 1 }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function viewportHeight() {
  return window.innerHeight;
}

function getStateScrollTop(index) {
  const item = STATES[index];
  if (!item) return 0;

  if (item.type === "chapter") {
    return document.getElementById(item.id)?.offsetTop || 0;
  }

  if (item.type === "skill") {
    return (document.getElementById("what-i-do")?.offsetTop || 0) +
      item.index * viewportHeight();
  }

  if (item.type === "tech") {
    return (document.getElementById("build-with")?.offsetTop || 0) +
      item.index * viewportHeight();
  }

  if (item.type === "project") {
    return (document.getElementById("my-work")?.offsetTop || 0) +
      item.index * viewportHeight();
  }

  return 0;
}

function nearestStateIndex(scrollY = window.scrollY) {
  let closest = 0;
  let distance = Infinity;

  STATES.forEach((_, index) => {
    const currentDistance = Math.abs(getStateScrollTop(index) - scrollY);
    if (currentDistance < distance) {
      distance = currentDistance;
      closest = index;
    }
  });

  return closest;
}

function presetForState(index) {
  const item = STATES[index];

  if (!item) return DINO_PRESETS.home;

  if (item.type === "chapter") {
    return DINO_PRESETS[item.id] || DINO_PRESETS.home;
  }

  if (item.type === "skill") {
    return DINO_PRESETS[`skill${item.index}`];
  }

  if (item.type === "tech") {
    return DINO_PRESETS.tech;
  }

  if (item.type === "project") {
    return DINO_PRESETS.work;
  }

  return DINO_PRESETS.home;
}

/*
  Set the dino's viewport position directly. This avoids relying on
  DOM coordinates from a sticky scene that may not be visible yet.
*/
function setDinoPreset(preset, instant = false) {
  if (!dino || !preset) return;

  /* Cap width so oversized presets never overflow small viewports. */
  const width = Math.min(preset.size, window.innerWidth * 0.62);
  const x = (window.innerWidth * preset.x / 100) - width / 2;
  const y = (window.innerHeight * preset.y / 100) - width * 0.42;

  dino.style.width = `${width}px`;
  dino.style.left = `${Math.round(x)}px`;
  dino.style.top = `${Math.round(y)}px`;
  dino.style.transform = `scaleX(${preset.flip})`;

  if (instant) {
    dino.style.transition = "none";
    requestAnimationFrame(() => {
      dino.style.transition = "";
    });
  }
}

function animateDinoToState(index, jumping = true) {
  const preset = presetForState(index);

  if (jumping) {
    dino.classList.remove("dino-jump");
    void dino.offsetWidth;
    dino.classList.add("dino-jump");
  }

  setDinoPreset(preset, false);

  window.setTimeout(() => {
    dino.classList.remove("dino-jump");
  }, 980);
}

function setWorldState(index) {
  document.documentElement.dataset.storyState = String(index);

  const item = STATES[index];

  sections.forEach(section => {
    const id = section.dataset.chapter;
    const active =
      (item.type === "chapter" && id === item.id) ||
      (item.type === "skill" && id === "what-i-do") ||
      (item.type === "tech" && id === "build-with") ||
      (item.type === "project" && id === "my-work");

    section.classList.toggle("is-visible", active);
  });

  navLinks.forEach(link => {
    const target = link.dataset.nav;
    const active =
      target === item.id ||
      (target === "what-i-do" && item.type === "skill") ||
      (target === "build-with" && item.type === "tech") ||
      (target === "my-work" && item.type === "project") ||
      (target === "currently-working" && item.id === "currently-working");

    link.classList.toggle("active", active);
  });
}

function updateSkill(index, animate = true) {
  const skill = SKILLS[index];
  if (!skill) return;

  const copy = document.getElementById("skillCopy");
  const art = document.getElementById("skillArt");

  if (animate) {
    copy?.classList.add("swap");
    art?.classList.add("swap");
  }

  window.setTimeout(() => {
    skillNumber.textContent = String(index + 1).padStart(2, "0");
    skillTitle.textContent = skill.title;
    skillDescription.textContent = skill.desc;
    skillImage.src = skill.icon;
    skillImage.alt = `${skill.title} pixel art`;
    skillDots.forEach((dot, i) => dot.classList.toggle("active", i === index));

    copy?.classList.remove("swap");
    art?.classList.remove("swap");
  }, animate ? 170 : 0);
}

function updateTech(index, immediate = false) {
  techItems.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  if (!techItems[index] || !techWindow || !techTrack) return;

  /*
    Center the active icon. Track padding gives the first and last
    icons enough room to reach the center without page overflow.
  */
  const item = techItems[index];
  const itemCenter = item.offsetLeft + item.offsetWidth / 2;
  const targetCenter = techWindow.clientWidth / 2;
  const x = targetCenter - itemCenter;

  if (immediate) {
    techTrack.style.transition = "none";
    techTrack.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
    requestAnimationFrame(() => {
      techTrack.style.transition = "";
    });
  } else {
    techTrack.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
  }

  techCounter.textContent = String(index + 1).padStart(2, "0");
}

function updateProject(index, animate = true) {
  projects.forEach((project, i) => {
    project.classList.toggle("active", i === index);
  });

  projectCounter.textContent = String(index + 1).padStart(2, "0");

  if (animate && projects[index]) {
    const project = projects[index];
    project.classList.remove("morph-in");
    void project.offsetWidth;
    project.classList.add("morph-in");

    window.setTimeout(() => {
      project.classList.remove("morph-in");
    }, 800);
  }
}

function activateState(index, { animate = true, moving = true } = {}) {
  const item = STATES[index];
  if (!item) return;

  state.index = index;
  setWorldState(index);

  if (item.type === "skill") updateSkill(item.index, animate);
  if (item.type === "tech") updateTech(item.index, !animate);
  if (item.type === "project") updateProject(item.index, animate);

  if (moving) {
    animateDinoToState(index, true);
  } else {
    setDinoPreset(presetForState(index), true);
  }

  if (item.type === "chapter" && item.id === "currently-working") {
    dino.classList.add("mirrored");
  } else {
    dino.classList.remove("mirrored");
  }
}

/*
  Move to exactly one navigable state. The browser still has one
  continuous document; the smooth scroll simply lands on the next
  scene/state.
*/
function goToState(index, direction = 1) {
  if (state.locked) return;

  const target = clamp(index, 0, STATES.length - 1);
  if (target === state.index) return;

  state.locked = true;
  document.body.classList.add("is-transitioning");

  const targetY = getStateScrollTop(target);
  const started = performance.now();

  /*
    Start the dino's size/position/orientation transition at the same
    time as the page movement so the entire sequence feels connected.
  */
  activateState(target, { animate: true, moving: true });

  window.scrollTo({
    top: targetY,
    behavior: "smooth"
  });

  function settle(now) {
    const close = Math.abs(window.scrollY - targetY) <= 3;
    const timeout = now - started >= 1200;

    if (!close && !timeout) {
      requestAnimationFrame(settle);
      return;
    }

    window.scrollTo({ top: targetY, behavior: "auto" });

    window.setTimeout(() => {
      state.locked = false;
      document.body.classList.remove("is-transitioning");
      syncScroll(false);
    }, 120);
  }

  requestAnimationFrame(settle);
}

function navigate(direction) {
  if (state.locked) return;

  const current = nearestStateIndex();
  state.index = current;

  const next = current + (direction > 0 ? 1 : -1);

  if (next < 0 || next >= STATES.length) return;

  goToState(next, direction);
}

/* One centralized wheel handler. */
window.addEventListener("wheel", event => {
  const now = performance.now();

  if (state.locked) {
    event.preventDefault();
    return;
  }

  if (now - state.lastWheelAt < WHEEL_COOLDOWN) {
    event.preventDefault();
    return;
  }

  if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;

  event.preventDefault();
  state.lastWheelAt = now;

  navigate(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

/* Keyboard navigation. */
window.addEventListener("keydown", event => {
  const forward = event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ";
  const backward = event.key === "ArrowUp" || event.key === "PageUp";

  if (!forward && !backward) return;

  event.preventDefault();
  navigate(forward ? 1 : -1);
});

/* Touch navigation. */
window.addEventListener("touchstart", event => {
  const touch = event.touches[0];
  state.touchStartY = touch.clientY;
  state.touchStartX = touch.clientX;
}, { passive: true });

window.addEventListener("touchend", event => {
  if (state.locked) return;

  const touch = event.changedTouches[0];
  const dy = state.touchStartY - touch.clientY;
  const dx = Math.abs(state.touchStartX - touch.clientX);

  if (Math.abs(dy) < TOUCH_THRESHOLD || dx > Math.abs(dy)) return;

  navigate(dy > 0 ? 1 : -1);
}, { passive: true });

/*
  Keep the UI synchronized if the user uses the scrollbar or
  resizes the browser.
*/
function syncScroll(allowStateChange = true) {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const ratio = clamp(window.scrollY / maxScroll, 0, 1);

  progressBar.style.height = `${ratio * 100}%`;

  if (!allowStateChange || state.locked) return;

  const nearest = nearestStateIndex();

  if (nearest !== state.index) {
    state.index = nearest;
    activateState(nearest, { animate: false, moving: false });
  }
}

window.addEventListener("scroll", () => {
  if (state.scrollRaf) return;

  state.scrollRaf = requestAnimationFrame(() => {
    state.scrollRaf = 0;
    syncScroll(true);
  });
}, { passive: true });

window.addEventListener("resize", () => {
  const currentY = getStateScrollTop(state.index);

  window.scrollTo({ top: currentY, behavior: "auto" });

  requestAnimationFrame(() => {
    if (STATES[state.index]?.type === "tech") {
      updateTech(STATES[state.index].index, true);
    }

    setDinoPreset(presetForState(state.index), true);
    syncScroll(false);
  });
});

/* Navigation links jump to the first state of a major chapter. */
navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const target = link.dataset.nav;

    let index = 0;

    if (target === "home") {
      index = 0;
    } else if (target === "about") {
      index = 1;
    } else if (target === "what-i-do") {
      index = STATES.findIndex(item => item.type === "skill" && item.index === 0);
    } else if (target === "build-with") {
      index = STATES.findIndex(item => item.type === "tech" && item.index === 0);
    } else if (target === "my-work") {
      index = STATES.findIndex(item => item.type === "project" && item.index === 0);
    } else {
      index = STATES.findIndex(item => item.type === "chapter" && item.id === target);
    }

    if (index >= 0) goToState(index, index > state.index ? 1 : -1);
  });
});

/* Contact form creates an email draft without requiring a backend. */
form?.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const subject = String(data.get("subject") || "Portfolio contact").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !email || !message) {
    formStatus.textContent = "PLEASE COMPLETE THE REQUIRED FIELDS.";
    return;
  }

  const recipient = "muhammxdumxr4477@gmail.com";
  const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

  window.location.href =
    `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  formStatus.textContent = "OPENING YOUR EMAIL CLIENT...";
});

document.querySelectorAll("img").forEach(img => {
  img.addEventListener("error", () => {
    console.warn(`[portfolio] Missing image: ${img.getAttribute("src")}`);
  });
});

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

window.addEventListener("load", () => {
  activateState(0, { animate: false, moving: false });

  requestAnimationFrame(() => {
    updateTech(0, true);
    setDinoPreset(DINO_PRESETS.home, true);
    syncScroll(false);
  });
});
