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

const storeListingsNode = document.querySelector("[data-store-listings]");
const storeCountNode = document.querySelector("[data-store-count]");
const storeUpdatedNode = document.querySelector("[data-store-updated]");

const formatStoreDate = (value) => {
  if (!value) {
    return "Seed listing data is loaded until the first Etsy sync runs.";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Latest Etsy sync loaded.";
  }

  return `Updated ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const createTextNode = (tagName, className, text) => {
  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  node.textContent = text;
  return node;
};

const createStoreCard = (listing) => {
  const card = document.createElement("article");
  card.className = "store-card";

  const media = document.createElement("a");
  media.className = "store-card-media";
  media.href = listing.url;
  media.target = "_blank";
  media.rel = "noopener";
  media.setAttribute("aria-label", `View ${listing.title} on Etsy`);

  const image = document.createElement("img");
  image.src = listing.image || "assets/images/materialmatrix-logo.png";
  image.alt = listing.title;
  image.loading = "lazy";
  media.append(image);
  card.append(media);

  const body = document.createElement("div");
  body.className = "store-card-body";

  body.append(createTextNode("h3", "", listing.title));

  const meta = document.createElement("div");
  meta.className = "store-card-meta";
  meta.append(createTextNode("strong", "", listing.price || "View price on Etsy"));

  if (Number.isFinite(Number(listing.quantity))) {
    meta.append(createTextNode("span", "", `${listing.quantity} available`));
  }

  body.append(meta);

  if (listing.description) {
    body.append(createTextNode("p", "", listing.description));
  }

  if (Array.isArray(listing.tags) && listing.tags.length > 0) {
    const tags = document.createElement("div");
    tags.className = "tag-list";

    listing.tags.slice(0, 4).forEach((tag) => {
      tags.append(createTextNode("span", "tag", tag));
    });

    body.append(tags);
  }

  const link = document.createElement("a");
  link.className = "button button-secondary store-card-link";
  link.href = listing.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "View on Etsy";
  body.append(link);

  card.append(body);
  return card;
};

const renderStoreEmptyState = (title, message) => {
  if (!storeListingsNode) {
    return;
  }

  storeListingsNode.replaceChildren();

  const empty = document.createElement("article");
  empty.className = "store-empty";
  empty.append(createTextNode("strong", "", title));
  empty.append(createTextNode("p", "", message));
  storeListingsNode.append(empty);
};

const loadStoreListings = async () => {
  if (!storeListingsNode) {
    return;
  }

  try {
    const response = await fetch(`data/etsy-listings.json?v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Etsy listing data file was not found.");
    }

    const data = await response.json();
    const listings = Array.isArray(data.listings) ? data.listings : [];

    if (storeCountNode) {
      storeCountNode.textContent = `${listings.length.toLocaleString()} active listing${listings.length === 1 ? "" : "s"}`;
    }

    if (storeUpdatedNode) {
      storeUpdatedNode.textContent = formatStoreDate(data.updatedAt);
    }

    if (listings.length === 0) {
      renderStoreEmptyState(
        "No active Etsy listings found",
        "Check back soon or open the Etsy shop directly."
      );
      return;
    }

    storeListingsNode.replaceChildren(...listings.map(createStoreCard));
  } catch {
    if (storeCountNode) {
      storeCountNode.textContent = "Store unavailable";
    }

    if (storeUpdatedNode) {
      storeUpdatedNode.textContent = "The saved Etsy listing data could not be loaded.";
    }

    renderStoreEmptyState(
      "Listings could not be loaded",
      "Open the Etsy shop directly to see current products."
    );
  }
};

loadStoreListings();

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
