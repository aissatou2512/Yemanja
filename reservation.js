const SUPABASE_URL = "https://ezybdlomqtrwaqeewnyj.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_hO3-pETuPEEenZZMCTVJxQ_bHxt9_yS";
const RESTAURANT_ID = "999c925b-bac3-430a-80bb-860ef386f528";
const RESERVATION_EMAIL = "aissatouba.aiba@gmail.com";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.querySelector("[data-reservation-form]");
const steps = Array.from(form.querySelectorAll("[data-step]"));
const progressFill = document.querySelector("[data-progress-fill]");
const progressSteps = Array.from(document.querySelectorAll("[data-progress-step]"));
const confirmation = document.querySelector("[data-confirmation]");
const reservationShell = document.querySelector(".reservation-shell");
const submitError = document.querySelector("[data-submit-error]");
const submitButton = document.querySelector("[data-submit]");
const submitLabel = document.querySelector("[data-submit-label]");

let currentStep = 1;
const totalSteps = steps.length;

/* ---------------------------------------------------------------------- */
/* Navigation entre étapes                                                */
/* ---------------------------------------------------------------------- */
function goToStep(stepNumber) {
  steps.forEach((fieldset) => {
    const isTarget = Number(fieldset.dataset.step) === stepNumber;
    fieldset.disabled = !isTarget; // les champs masqués ne sont ni validés ni soumis
    fieldset.hidden = !isTarget;
    fieldset.classList.toggle("is-active", isTarget);
  });

  progressSteps.forEach((item) => {
    const stepValue = Number(item.dataset.progressStep);
    item.classList.toggle("is-active", stepValue === stepNumber);
    item.classList.toggle("is-done", stepValue < stepNumber);
  });

  progressFill.style.width = `${((stepNumber - 1) / (totalSteps - 1)) * 100}%`;

  if (stepNumber === 3) fillSummary();

  currentStep = stepNumber;
  reservationShell.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------------------------------------------------------------- */
/* Validation d'étape (empêche de continuer si champs obligatoires vides) */
/* ---------------------------------------------------------------------- */
function validateStep(stepNumber) {
  const fieldset = steps.find((step) => Number(step.dataset.step) === stepNumber);
  const fields = Array.from(fieldset.querySelectorAll("input, select, textarea"));

  fields.forEach((field) => field.setAttribute("data-touched", "true"));

  // Règle spécifique : le restaurant est fermé le lundi
  const dateField = fieldset.querySelector("[data-res-date]");
  if (dateField && dateField.value) {
    const selectedDay = new Date(`${dateField.value}T00:00:00`).getDay(); // 1 = lundi
    dateField.setCustomValidity(selectedDay === 1 ? "Fermé le lundi — merci de choisir un autre jour." : "");
  }

  if (!fieldset.checkValidity()) {
    fieldset.reportValidity();
    return false;
  }

  return true;
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (validateStep(currentStep)) goToStep(currentStep + 1);
  });
});

document.querySelectorAll("[data-prev]").forEach((button) => {
  button.addEventListener("click", () => goToStep(currentStep - 1));
});

/* ---------------------------------------------------------------------- */
/* Récapitulatif (étape 3)                                                */
/* ---------------------------------------------------------------------- */
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function collectData() {
  const formData = new FormData(form);
  return {
    date: formData.get("date"),
    time: formData.get("time"),
    guests: formData.get("guests"),
    zone: formData.get("zone"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  };
}

function fillSummary() {
  const data = collectData();
  const contact = `${data.firstName} ${data.lastName} — ${data.email} — ${data.phone}`;

  document.querySelector('[data-summary="date"]').textContent = formatDate(data.date);
  document.querySelector('[data-summary="time"]').textContent = data.time ? `${data.time.replace(":", "h")}` : "—";
  document.querySelector('[data-summary="guests"]').textContent = data.guests ? `${data.guests} pers.` : "—";
  document.querySelector('[data-summary="zone"]').textContent = data.zone || "—";
  document.querySelector('[data-summary="contact"]').textContent = contact;
}

function fillConfirmation() {
  const data = collectData();
  const contact = `${data.firstName} ${data.lastName} — ${data.email} — ${data.phone}`;

  document.querySelector('[data-confirm="date"]').textContent = formatDate(data.date);
  document.querySelector('[data-confirm="time"]').textContent = data.time ? `${data.time.replace(":", "h")}` : "—";
  document.querySelector('[data-confirm="guests"]').textContent = data.guests ? `${data.guests} pers.` : "—";
  document.querySelector('[data-confirm="zone"]').textContent = data.zone || "—";
  document.querySelector('[data-confirm="contact"]').textContent = contact;
}

async function sendReservation(data) {
  const { data: success, error } = await supabaseClient.rpc("reserver_creneau", {
    p_restaurant_id: RESTAURANT_ID,
    p_date: data.date,
    p_heure: data.time,
    p_nb_personnes: parseInt(data.guests, 10),
    p_nom_client: `${data.firstName} ${data.lastName}`,
    p_email: data.email,
    p_telephone: data.phone,
  });

  if (error) throw new Error("technique");
  if (success === false) throw new Error("complet");

  // Réservation confirmée → notifier le resto par email
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/envoyer-email-reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        nom_client: `${data.firstName} ${data.lastName}`,
        email: data.email,
        telephone: data.phone,
        date: data.date,
        heure: data.time,
        nb_personnes: data.guests,
        message: data.message,
        nom_restaurant: "Yemanja by Sweet Coffee",
        email_restaurant: RESERVATION_EMAIL,
      }),
    });
  } catch (emailError) {
    console.error("Email non envoyé :", emailError);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;

  // Récupère le token généré par le widget Turnstile
  const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;

  if (!turnstileToken) {
    submitError.hidden = false;
    submitError.textContent = "Merci de valider la vérification anti-robot.";
    return;
  }

  // Vérifie ce token auprès de notre Edge Function, avant d'aller plus loin
  submitButton.classList.add("is-loading");
  submitLabel.textContent = "VÉRIFICATION…";

  try {
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    console.log("Token Turnstile récupéré :", turnstileToken);
    const captchaRes = await fetch(`${SUPABASE_URL}/functions/v1/verifier-captcha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token: turnstileToken }),
    });
    const captchaResult = await captchaRes.json();

    if (!captchaResult.success) {
      submitButton.classList.remove("is-loading");
      submitLabel.textContent = "CONFIRMER LA RÉSERVATION";
      submitError.hidden = false;
      submitError.textContent = "Vérification anti-robot échouée. Merci de réessayer.";
      return;
    }
  } catch {
    submitButton.classList.remove("is-loading");
    submitLabel.textContent = "CONFIRMER LA RÉSERVATION";
    submitError.hidden = false;
    submitError.textContent = "Erreur de vérification. Merci de réessayer.";
    return;
  }

  steps.forEach((fieldset) => { fieldset.disabled = false; });

  const data = collectData();
  submitError.hidden = true;
  submitError.classList.remove("is-visible");
  submitLabel.textContent = "ENVOI EN COURS…";

  try {
    await sendReservation(data);
    showConfirmation();
  } catch (error) {
    submitButton.classList.remove("is-loading");
    submitLabel.textContent = "CONFIRMER LA RÉSERVATION";
    submitError.hidden = false;
    submitError.classList.add("is-visible");

    if (error.message === "complet") {
      submitError.textContent = "Ce créneau est complet. Merci de choisir une autre heure.";
    } else {
      submitError.innerHTML =
        `Une erreur est survenue lors de l'envoi. Vous pouvez réessayer, ` +
        `ou <a href="${buildMailtoFallback(data)}">nous écrire directement par e-mail</a>.`;
    }
  }
});

function showConfirmation() {
  fillConfirmation();
  form.hidden = true;
  document.querySelector(".reservation-progress").hidden = true;
  confirmation.hidden = false;
  window.requestAnimationFrame(() => confirmation.classList.add("is-visible"));
  reservationShell.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Initialisation : date minimale = aujourd'hui */
const dateInput = document.querySelector("[data-res-date]");
if (dateInput) {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

goToStep(1);