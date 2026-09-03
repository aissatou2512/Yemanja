/* ==========================================================================
   PAGE "LA CARTE" — scripts
   ========================================================================== */

const body = document.body;

/* --------------------------------------------------------------------------
   MENU MOBILE — PAGE LA CARTE
   -------------------------------------------------------------------------- */

const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

if (menuToggle && mobileMenu) {
  const mobileLinks = mobileMenu.querySelectorAll("a");

  const setMenu = (isOpen) => {
    body.classList.toggle("menu-is-open", isOpen);
    mobileMenu.classList.toggle("is-open", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  };

  menuToggle.addEventListener("click", (event) => {
    event.preventDefault();

    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    setMenu(!isOpen);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menuToggle.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   EN-TÊTE DYNAMIQUE AU SCROLL
   -------------------------------------------------------------------------- */

const carteHeader = document.querySelector("[data-header]");

if (carteHeader) {
  const onHeaderScroll = () => {
    carteHeader.classList.toggle(
      "is-scrolled",
      window.scrollY > 12
    );
  };

  window.addEventListener("scroll", onHeaderScroll, {
    passive: true,
  });

  onHeaderScroll();
}

/* --------------------------------------------------------------------------
   ONGLET À MANGER / À BOIRE
   -------------------------------------------------------------------------- */

const carteTabs = document.querySelectorAll("[data-carte-tab]");
const cartePanels = document.querySelectorAll("[data-carte-panel]");

const setCarteTab = (target) => {
  carteTabs.forEach((tab) => {
    const isActive = tab.dataset.carteTab === target;

    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  cartePanels.forEach((panel) => {
    const isActive = panel.dataset.cartePanel === target;

    if (isActive) {
      panel.hidden = false;
      panel.classList.remove("is-active");

      window.requestAnimationFrame(() => {
        panel.classList.add("is-active");
      });
    } else {
      panel.classList.remove("is-active");
      panel.hidden = true;
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

carteTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setCarteTab(tab.dataset.carteTab);
  });
});

/* --------------------------------------------------------------------------
   APPARITION DES CATÉGORIES + CASCADE DES PLATS
   -------------------------------------------------------------------------- */

const carteRevealItems = document.querySelectorAll(".carte-reveal");

carteRevealItems.forEach((category) => {
  category.querySelectorAll(".carte-item").forEach((item, index) => {
    item.style.transitionDelay =
      `${Math.min(index, 12) * 45}ms`;
  });
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -6% 0px",
    }
  );

  carteRevealItems.forEach((item) => {
    revealObserver.observe(item);
  });
} else {
  carteRevealItems.forEach((item) => {
    item.classList.add("is-visible");
  });
}