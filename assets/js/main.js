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
    let currentIndex = uniqueSlides.findIndex(
      (slide) => slide.src === heroImage.getAttribute("src")
    );

    if (currentIndex === -1) {
      currentIndex = 0;
      heroImage.src = uniqueSlides[0].src;
      heroImage.alt = uniqueSlides[0].alt;
    }

    if (uniqueSlides.length > 1) {
      const swapSlide = () => {
        galleryRotator.classList.add("is-rotating");

        window.setTimeout(() => {
          currentIndex = (currentIndex + 1) % uniqueSlides.length;
          const nextSlide = uniqueSlides[currentIndex];
          heroImage.src = nextSlide.src;
          heroImage.alt = nextSlide.alt;
          galleryRotator.classList.remove("is-rotating");
        }, 280);
      };

      window.setInterval(swapSlide, 3200);
    }
  }
}
