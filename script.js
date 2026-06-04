const FORM_EMAIL = 'shperling05@inbox.ru';

const form = document.getElementById('diagnostic-form');
const submitBtn = form.querySelector('.form__submit');
const formError = document.getElementById('form-error');
const successOverlay = document.getElementById('success-overlay');
const successClose = document.getElementById('success-close');
const sphereSelect = document.getElementById('sphere-select');
const sphereOtherField = document.getElementById('sphere-other-field');
const sphereOtherInput = form.querySelector('[name="sphereOther"]');

const sphereLabels = {
  retail: 'Розничная торговля и e-commerce',
  services: 'Сфера услуг',
  horeca: 'HoReCo',
  realestate: 'Недвижимость',
  b2b: 'B2B',
  tourism: 'Туризм и гостиничный бизнес',
  education: 'Образование',
  beauty: 'Beauty /wellness',
  other: 'Другое',
};

const marketingSystemLabels = {
  unstable: 'Да, но работает нестабильно',
  tools: 'Есть отдельные инструменты, без общей логики',
  chaos: 'Нет, всё хаотично',
  unsure: 'Сложно ответить',
};

sphereSelect.addEventListener('change', () => {
  const isOther = sphereSelect.value === 'other';
  sphereOtherField.hidden = !isOther;
  sphereOtherInput.required = isOther;
  if (!isOther) sphereOtherInput.value = '';
});

function hideFormError() {
  formError.hidden = true;
  formError.textContent = '';
}

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitBtn.textContent = isSubmitting ? 'Отправляем…' : 'Перейти к диагностике';
}

function showSuccess() {
  document.body.classList.add('is-submitted');
  successOverlay.hidden = false;
  successOverlay.setAttribute('aria-hidden', 'false');
  successClose.focus();
}

function closeSuccess() {
  successOverlay.hidden = true;
  successOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-submitted');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

successClose.addEventListener('click', closeSuccess);

successOverlay.addEventListener('click', (event) => {
  if (event.target === successOverlay) closeSuccess();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !successOverlay.hidden) closeSuccess();
});

async function sendToEmail(data, labels) {
  const response = await fetch(`https://formsubmit.co/ajax/${FORM_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: 'Новая заявка на диагностику — Marketing Kit',
      _template: 'table',
      name: data.name,
      email: data.email || '—',
      contact_channel: labels.contactChannelLabel,
      contact: data.contact,
      sphere: labels.sphereLabel,
      concern: data.concern,
      marketing_system: labels.marketingSystemLabel,
      request: data.request,
    }),
  });

  if (!response.ok) {
    throw new Error('send_failed');
  }

  return response.json();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideFormError();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const labels = {
    sphereLabel: data.sphere === 'other'
      ? `Другое: ${data.sphereOther || ''}`
      : sphereLabels[data.sphere] || data.sphere,
    marketingSystemLabel: marketingSystemLabels[data.marketingSystem] || data.marketingSystem,
    contactChannelLabel: data.contactChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram',
  };

  setSubmitting(true);

  try {
    await sendToEmail(data, labels);

    const entry = {
      ...data,
      ...labels,
      privacyConsent: data.privacyConsent === 'on',
      submittedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('marketingKitDiagnostics') || '[]');
    existing.push(entry);
    localStorage.setItem('marketingKitDiagnostics', JSON.stringify(existing));

    form.reset();
    sphereOtherField.hidden = true;
    sphereOtherInput.required = false;
    showSuccess();
  } catch {
    showFormError('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Instagram.');
  } finally {
    setSubmitting(false);
  }
});
