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

const projectPromptTemplate = `
  <div class="project-prompt-backdrop" data-project-prompt-backdrop hidden>
    <div
      class="project-prompt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-prompt-title"
    >
      <button
        class="project-prompt-close"
        type="button"
        aria-label="Close project submission instructions"
        data-project-prompt-close
      >
        ×
      </button>
      <p class="eyebrow">Start a Project</p>
      <h2 id="project-prompt-title">How to submit a request through Facebook</h2>
      <p class="supporting-copy">
        Send your project through Facebook Messenger so MaterialMatrix can review
        the details and reply with next steps.
      </p>
      <div class="project-prompt-steps">
        <p><strong>1.</strong> Open the MaterialMatrix Facebook page.</p>
        <p><strong>2.</strong> Click <strong>Message</strong> to start a Messenger conversation.</p>
        <p><strong>3.</strong> Send your idea, sketch, photos, measurements, files, or part references.</p>
        <p><strong>4.</strong> Include what the part needs to do, any size or material needs, and your timeline if you have one.</p>
      </div>
      <div class="hero-actions">
        <a
          class="button button-primary"
          href="https://www.facebook.com/profile.php?id=61560763095133"
          target="_blank"
          rel="noreferrer"
        >
          Open Facebook Messenger
        </a>
        <button class="button button-secondary" type="button" data-project-prompt-close>
          Close
        </button>
      </div>
    </div>
  </div>
`;

const projectPromptTriggers = document.querySelectorAll("[data-project-prompt-trigger]");

if (projectPromptTriggers.length > 0) {
  document.body.insertAdjacentHTML("beforeend", projectPromptTemplate);

  const projectPromptBackdrop = document.querySelector("[data-project-prompt-backdrop]");
  const projectPromptCloseButtons = document.querySelectorAll("[data-project-prompt-close]");

  const openProjectPrompt = () => {
    if (!projectPromptBackdrop) return;
    projectPromptBackdrop.hidden = false;
    document.body.classList.add("prompt-open");
  };

  const closeProjectPrompt = () => {
    if (!projectPromptBackdrop) return;
    projectPromptBackdrop.hidden = true;
    document.body.classList.remove("prompt-open");
  };

  projectPromptTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openProjectPrompt();
    });
  });

  projectPromptCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProjectPrompt);
  });

  projectPromptBackdrop?.addEventListener("click", (event) => {
    if (event.target === projectPromptBackdrop) {
      closeProjectPrompt();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !projectPromptBackdrop?.hidden) {
      closeProjectPrompt();
    }
  });
}
