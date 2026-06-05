// URL веб-приложения Google Apps Script (см. google-apps-script/Code.gs)
const FORM_HANDLER_URL = 'https://script.google.com/macros/s/AKfycbzAVtQz40rbWYYCegmZK-lhanU0qgzNeIjUzOAmTDRlfFHxMzB_oZFc4VELxjcCuA_-CA/exec';
const FORM_EMAIL = 'e.marketing.kit.agency@gmail.com';

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

function buildPayload(data, labels) {
  return {
    name: data.name,
    email: data.email || '',
    contact_channel: labels.contactChannelLabel,
    contact: data.contact,
    sphere: labels.sphereLabel,
    concern: data.concern,
    marketing_system: labels.marketingSystemLabel,
    request: data.request,
    submitted_at: new Date().toISOString(),
  };
}

async function sendToEmail(payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${FORM_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: 'Новая заявка на диагностику — Marketing Kit',
      _template: 'table',
      _captcha: 'false',
      name: payload.name,
      email: payload.email || '—',
      contact_channel: payload.contact_channel,
      contact: payload.contact,
      sphere: payload.sphere,
      concern: payload.concern,
      marketing_system: payload.marketing_system,
      request: payload.request,
    }),
  });

  if (!response.ok) {
    throw new Error('email_failed');
  }

  const result = await response.json();
  if (result.success === false) {
    throw new Error('email_failed');
  }

  return result;
}

async function sendToGoogleSheet(payload) {
  if (!FORM_HANDLER_URL) {
    return false;
  }

  try {
    const response = await fetch(FORM_HANDLER_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const result = JSON.parse(text);
    return Boolean(result.success);
  } catch {
    return false;
  }
}

async function sendForm(payload) {
  await sendToEmail(payload);
  await sendToGoogleSheet(payload);
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

  const payload = buildPayload(data, labels);

  setSubmitting(true);

  try {
    await sendForm(payload);

    const entry = {
      ...data,
      ...labels,
      privacyConsent: data.privacyConsent === 'on',
      submittedAt: payload.submitted_at,
    };

    const existing = JSON.parse(localStorage.getItem('marketingKitDiagnostics') || '[]');
    existing.push(entry);
    localStorage.setItem('marketingKitDiagnostics', JSON.stringify(existing));

    form.reset();
    sphereOtherField.hidden = true;
    sphereOtherInput.required = false;
    showSuccess();
  } catch (error) {
    if (error.message === 'handler_not_configured') {
      showFormError('Форма ещё не подключена. Укажите URL Google Script в настройках.');
    } else {
      showFormError('Не удалось отправить заявку на почту. Проверьте интернет и попробуйте ещё раз.');
    }
  } finally {
    setSubmitting(false);
  }
});
