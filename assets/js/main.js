const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const visitorCountNode = document.querySelector("[data-visitor-count]");
const customersServedCountNode = document.querySelector("[data-customers-served-count]");

const formatCounterValue = (value) => {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) ? count.toLocaleString() : "--";
};

const getVisitMarker = () => {
  try {
    return window.localStorage.getItem("materialmatrix-home-visited");
  } catch {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("materialmatrix_home_visited="))
      ?.split("=")[1];
  }
};

const setVisitMarker = () => {
  try {
    window.localStorage.setItem("materialmatrix-home-visited", "true");
    return;
  } catch {
    document.cookie =
      "materialmatrix_home_visited=true; max-age=31536000; path=/; SameSite=Lax";
  }
};

const loadVisitorCount = async () => {
  if (!visitorCountNode) {
    return;
  }

  const getUrl = "https://api.counterapi.dev/v1/materialmatrix-github-io/home-visitors/";
  const upUrl = "https://api.counterapi.dev/v1/materialmatrix-github-io/home-visitors/up";
  const hasVisited = getVisitMarker() === "true";
  const endpoint = hasVisited ? getUrl : upUrl;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Visitor counter request failed.");
    }

    const counter = await response.json();
    visitorCountNode.textContent = formatCounterValue(counter.count);

    if (!hasVisited) {
      setVisitMarker();
    }
  } catch {
    visitorCountNode.textContent = "--";
  }
};

const loadCustomersServedCount = async () => {
  if (!customersServedCountNode) {
    return;
  }

  try {
    const response = await fetch(`data/customers-served-count.txt?v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Customers served count file was not found.");
    }

    const text = await response.text();
    const count = text.match(/-?\d+/)?.[0];
    customersServedCountNode.textContent = formatCounterValue(count);
  } catch {
    customersServedCountNode.textContent = "--";
  }
};

loadVisitorCount();
loadCustomersServedCount();

const createImageRotator = ({
  rotator,
  slides,
  getCurrentIndex = () => 0,
  updateSlide,
  slideDuration = 8000,
  fadeDuration = 280,
}) => {
  if (!rotator || slides.length === 0) {
    return;
  }

  const progressBar = rotator.querySelector("[data-rotator-progress]");
  const previousButton = rotator.querySelector("[data-rotator-prev]");
  const nextButton = rotator.querySelector("[data-rotator-next]");
  let currentIndex = getCurrentIndex();
  let advanceTimeoutId;
  let transitionTimeoutId;
  let progressFrame;
  let progressStart;
  let isTransitioning = false;

  if (currentIndex < 0 || currentIndex >= slides.length) {
    currentIndex = 0;
  }

  const stopProgress = () => {
    if (progressFrame) {
      window.cancelAnimationFrame(progressFrame);
      progressFrame = undefined;
    }
  };

  const setProgress = (value) => {
    if (progressBar) {
      progressBar.style.transform = `scaleX(${value})`;
    }
  };

  const startProgress = () => {
    if (!progressBar) {
      return;
    }

    stopProgress();
    progressStart = performance.now();
    setProgress(0);

    const tick = (now) => {
      const elapsed = now - progressStart;
      const ratio = Math.min(elapsed / slideDuration, 1);
      setProgress(ratio);

      if (ratio < 1) {
        progressFrame = window.requestAnimationFrame(tick);
      }
    };

    progressFrame = window.requestAnimationFrame(tick);
  };

  const restartTimer = () => {
    window.clearTimeout(advanceTimeoutId);
    startProgress();
    advanceTimeoutId = window.setTimeout(() => {
      goToSlide(currentIndex + 1);
    }, slideDuration);
  };

  const goToSlide = (index) => {
    if (isTransitioning) {
      return;
    }

    isTransitioning = true;
    stopProgress();
    window.clearTimeout(advanceTimeoutId);
    window.clearTimeout(transitionTimeoutId);
    rotator.classList.add("is-rotating");

    transitionTimeoutId = window.setTimeout(() => {
      currentIndex = (index + slides.length) % slides.length;
      updateSlide(currentIndex);
      rotator.classList.remove("is-rotating");
      isTransitioning = false;
      restartTimer();
    }, fadeDuration);
  };

  updateSlide(currentIndex);
  setProgress(0);

  if (slides.length > 1) {
    previousButton?.addEventListener("click", () => {
      goToSlide(currentIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
      goToSlide(currentIndex + 1);
    });

    restartTimer();
  } else {
    previousButton?.setAttribute("disabled", "");
    nextButton?.setAttribute("disabled", "");
  }
};

const galleryRotator = document.querySelector("[data-gallery-rotator]");

if (galleryRotator) {
  const heroImage = galleryRotator.querySelector("img");
  const galleryImages = Array.from(document.querySelectorAll(".gallery-card img"));
  const slides = galleryImages
    .map((image) => ({
      src: image.getAttribute("src"),
      alt: image.getAttribute("alt") || "",
    }))
    .filter((slide) => slide.src);

  const uniqueSlides = slides.filter(
    (slide, index, collection) =>
      collection.findIndex((candidate) => candidate.src === slide.src) === index
  );

  if (heroImage) {
    createImageRotator({
      rotator: galleryRotator,
      slides: uniqueSlides,
      getCurrentIndex: () =>
        uniqueSlides.findIndex((slide) => slide.src === heroImage.getAttribute("src")),
      updateSlide: (index) => {
        const nextSlide = uniqueSlides[index];
        heroImage.src = nextSlide.src;
        heroImage.alt = nextSlide.alt;
      },
    });
  }
}

document.querySelectorAll("[data-cell-rotator]").forEach((rotator) => {
  const slides = Array.from(rotator.querySelectorAll("img"));

  createImageRotator({
    rotator,
    slides,
    getCurrentIndex: () => slides.findIndex((slide) => slide.classList.contains("is-active")),
    updateSlide: (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
    },
  });
});
