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

const galleryRotator = document.querySelector("[data-gallery-rotator]");

if (galleryRotator) {
  const heroImage = galleryRotator.querySelector("img");
  const progressBar = galleryRotator.querySelector("[data-rotator-progress]");
  const previousButton = galleryRotator.querySelector("[data-rotator-prev]");
  const nextButton = galleryRotator.querySelector("[data-rotator-next]");
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

  if (heroImage && uniqueSlides.length > 0) {
    const slideDuration = 8000;
    const fadeDuration = 280;
    let currentIndex = uniqueSlides.findIndex(
      (slide) => slide.src === heroImage.getAttribute("src")
    );
    let intervalId;
    let progressFrame;
    let progressStart;
    let isTransitioning = false;

    if (currentIndex === -1) {
      currentIndex = 0;
      heroImage.src = uniqueSlides[0].src;
      heroImage.alt = uniqueSlides[0].alt;
    }

    const updateSlide = (index) => {
      const nextSlide = uniqueSlides[index];
      heroImage.src = nextSlide.src;
      heroImage.alt = nextSlide.alt;
    };

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
      window.clearInterval(intervalId);
      startProgress();
      intervalId = window.setInterval(() => {
        goToSlide(currentIndex + 1);
      }, slideDuration);
    };

    const goToSlide = (index) => {
      if (isTransitioning) {
        return;
      }

      isTransitioning = true;
      stopProgress();
      galleryRotator.classList.add("is-rotating");

      window.setTimeout(() => {
        currentIndex = (index + uniqueSlides.length) % uniqueSlides.length;
        updateSlide(currentIndex);
        galleryRotator.classList.remove("is-rotating");
        isTransitioning = false;
        restartTimer();
      }, fadeDuration);
    };

    updateSlide(currentIndex);
    setProgress(0);

    if (uniqueSlides.length > 1) {
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
  }
}
