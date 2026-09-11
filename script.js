const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileLinks = document.querySelectorAll("[data-mobile-menu] a");
const heroVideo = document.querySelector("[data-hero-video]");
const languageButtons = document.querySelectorAll("[data-language]");
const universe = document.querySelector("[data-universe]");
const universeRevealItems = document.querySelectorAll(".universe-reveal");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const setMenu = (isOpen) => {
  body.classList.toggle("menu-is-open", isOpen);
  mobileMenu.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
};

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

menuToggle.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    languageButtons.forEach((languageButton) => {
      const isActive = languageButton === button;
      languageButton.classList.toggle("is-active", isActive);
      languageButton.setAttribute("aria-pressed", String(isActive));
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuToggle.focus();
  }
});

heroVideo.addEventListener("error", () => {
  heroVideo.classList.add("video-failed");
});

heroVideo.addEventListener("canplay", () => {
  heroVideo.classList.remove("video-failed");
});

heroVideo.addEventListener("playing", () => {
  heroVideo.classList.add("is-playing");
});

if (universe && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );

  universeRevealItems.forEach((item) => revealObserver.observe(item));
} else {
  universeRevealItems.forEach((item) => item.classList.add("is-visible"));
}

if (!reduceMotion && parallaxItems.length) {
  let parallaxFrame = null;

  const updateParallax = () => {
    parallaxItems.forEach((item) => {
      const bounds = item.getBoundingClientRect();
      const distanceFromCenter = bounds.top + bounds.height / 2 - window.innerHeight / 2;
      const intensity = Number(item.dataset.speed) || 0.14;
      const offset = Math.max(-18, Math.min(18, distanceFromCenter * -intensity));
      item.style.setProperty("--parallax-y", `${offset}px`);
    });
    parallaxFrame = null;
  };

  const requestParallaxUpdate = () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
  window.addEventListener("resize", requestParallaxUpdate);
  requestParallaxUpdate();
}

window.addEventListener("load", () => {
  window.requestAnimationFrame(() => body.classList.add("is-ready"));
});

/* --------------------------------------------------------------------------
   SECTION "LA CARTE" : bascule entre les onglets À Manger / À Boire
-------------------------------------------------------------------------- */
const menuTabs = document.querySelectorAll("[data-menu-tab]");
const menuPanels = document.querySelectorAll("[data-menu-panel]");

const setMenuTab = (target) => {
  menuTabs.forEach((tab) => {
    const isActive = tab.dataset.menuTab === target;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  menuPanels.forEach((panel) => {
    const isActive = panel.dataset.menuPanel === target;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
};

menuTabs.forEach((tab) => {
  tab.addEventListener("click", () => setMenuTab(tab.dataset.menuTab));
});

/* --------------------------------------------------------------------------
   SECTION "BEST SELLERS" : retournement des flash cards (flip 3D)
   Un clic/tap sur une carte la retourne ; un second clic/tap la remet
   à l'endroit. Fonctionne aussi au clavier (bouton natif, touche Entrée).
-------------------------------------------------------------------------- */
const flipCards = document.querySelectorAll("[data-flip-card]");

flipCards.forEach((card) => {
  const trigger = card.querySelector(".flip-card__inner");

  trigger.addEventListener("click", () => {
    const isFlipped = card.classList.toggle("is-flipped");
    trigger.setAttribute("aria-pressed", String(isFlipped));
  });
});


/* --------------------------------------------------------------------------
   SECTION "BEST SELLERS" : défilement automatique du carrousel mobile
   Actif uniquement en dessous de 700px (le seuil qui active le carrousel
   en CSS). Défilement lent, boucle infinie, pause dès que l'utilisateur
   touche/scrolle manuellement, reprise après un court délai.
-------------------------------------------------------------------------- */
const bestsellersGrid = document.querySelector(".bestsellers-grid");

if (bestsellersGrid) {
  const bestsellersMediaQuery = window.matchMedia("(max-width: 700px)");
  const AUTOSCROLL_DELAY = 3200;
  let bestsellersTimer = null;
  let bestsellersResumeTimer = null;

  const getCards = () => Array.from(bestsellersGrid.querySelectorAll(".flip-card"));

  const getCurrentIndex = () => {
    const cards = getCards();
    if (!cards.length) return 0;

    const gridCenter = bestsellersGrid.scrollLeft + bestsellersGrid.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - gridCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const scrollToIndex = (index) => {
    const cards = getCards();
    if (!cards.length) return;

    const targetIndex = (index + cards.length) % cards.length;
    const targetCard = cards[targetIndex];

    const gridCenter = bestsellersGrid.clientWidth / 2;
    const cardCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;

    bestsellersGrid.scrollTo({
      left: cardCenter - gridCenter,
      behavior: "smooth",
    });
  };

  const scrollToNext = () => {
    scrollToIndex(getCurrentIndex() + 1);
  };

  const startBestsellersAutoscroll = () => {
    if (reduceMotion || !bestsellersMediaQuery.matches) return;
    stopBestsellersAutoscroll();
    bestsellersTimer = window.setInterval(scrollToNext, AUTOSCROLL_DELAY);
  };

  function stopBestsellersAutoscroll() {
    if (bestsellersTimer) {
      window.clearInterval(bestsellersTimer);
      bestsellersTimer = null;
    }
  }

  const pauseThenResume = () => {
    stopBestsellersAutoscroll();
    if (bestsellersResumeTimer) window.clearTimeout(bestsellersResumeTimer);
    bestsellersResumeTimer = window.setTimeout(startBestsellersAutoscroll, AUTOSCROLL_DELAY);
  };

  // Pause dès que l'utilisateur interagit manuellement (touch, wheel, drag)
  ["touchstart", "wheel", "pointerdown"].forEach((eventName) => {
    bestsellersGrid.addEventListener(eventName, pauseThenResume, { passive: true });
  });

  // Réagit au passage desktop <-> mobile
  const handleBreakpointChange = () => {
    if (bestsellersMediaQuery.matches) {
      startBestsellersAutoscroll();
    } else {
      stopBestsellersAutoscroll();
      if (bestsellersResumeTimer) window.clearTimeout(bestsellersResumeTimer);
    }
  };

  if (bestsellersMediaQuery.addEventListener) {
    bestsellersMediaQuery.addEventListener("change", handleBreakpointChange);
  } else {
    // Fallback anciens navigateurs
    bestsellersMediaQuery.addListener(handleBreakpointChange);
  }

  handleBreakpointChange();
}
/* --------------------------------------------------------------------------
   SECTION "AVIS" : slider de témoignages
   Défilement auto lent, flèches, pagination, swipe tactile. Le défilement
   auto se met en pause dès que l'utilisateur interagit (clic, swipe,
   focus clavier) et reprend après un court délai.
-------------------------------------------------------------------------- */
const reviewsSlider = document.querySelector("[data-reviews-slider]");

if (reviewsSlider) {
  const track = reviewsSlider.querySelector("[data-reviews-track]");
  const cards = Array.from(reviewsSlider.querySelectorAll("[data-review]"));
  const dotsWrap = reviewsSlider.querySelector("[data-reviews-dots]");
  const prevButton = reviewsSlider.querySelector("[data-reviews-prev]");
  const nextButton = reviewsSlider.querySelector("[data-reviews-next]");

  let currentIndex = 0;
  let autoplayTimer = null;
  const AUTOPLAY_DELAY = 6000;

  // Construit les points de pagination, un par avis
  const dots = cards.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "reviews-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Aller à l'avis ${index + 1}`);
    dot.addEventListener("click", () => goTo(index, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(index, isManual) {
    currentIndex = (index + cards.length) % cards.length;

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    cards.forEach((card, i) => card.setAttribute("aria-hidden", String(i !== currentIndex)));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === currentIndex));

    if (isManual) restartAutoplay();
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1, true);
  }

  function startAutoplay() {
    if (reduceMotion) return;
    autoplayTimer = window.setInterval(next, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) window.clearInterval(autoplayTimer);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevButton.addEventListener("click", prev);
  nextButton.addEventListener("click", () => goTo(currentIndex + 1, true));

  // Pause au survol / focus clavier, reprise à la sortie
  reviewsSlider.addEventListener("mouseenter", stopAutoplay);
  reviewsSlider.addEventListener("mouseleave", startAutoplay);
  reviewsSlider.addEventListener("focusin", stopAutoplay);
  reviewsSlider.addEventListener("focusout", startAutoplay);

  // Swipe tactile
  let touchStartX = 0;
  let touchDeltaX = 0;

  track.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0].clientX;
      touchDeltaX = 0;
      stopAutoplay();
    },
    { passive: true },
  );

  track.addEventListener(
    "touchmove",
    (event) => {
      touchDeltaX = event.touches[0].clientX - touchStartX;
    },
    { passive: true },
  );

  track.addEventListener("touchend", () => {
    const SWIPE_THRESHOLD = 40;
    if (touchDeltaX > SWIPE_THRESHOLD) {
      prev();
    } else if (touchDeltaX < -SWIPE_THRESHOLD) {
      goTo(currentIndex + 1, true);
    } else {
      restartAutoplay();
    }
  });

  goTo(0);
  startAutoplay();
}