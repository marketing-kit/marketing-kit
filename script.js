const form = document.getElementById('diagnostic-form');
const successBlock = document.getElementById('form-success');
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

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const entry = {
    ...data,
    sphereLabel: data.sphere === 'other'
      ? `Другое: ${data.sphereOther || ''}`
      : sphereLabels[data.sphere] || data.sphere,
    marketingSystemLabel: marketingSystemLabels[data.marketingSystem] || data.marketingSystem,
    contactChannelLabel: data.contactChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram',
    privacyConsent: data.privacyConsent === 'on',
    submittedAt: new Date().toISOString(),
  };

  const existing = JSON.parse(localStorage.getItem('marketingKitDiagnostics') || '[]');
  existing.push(entry);
  localStorage.setItem('marketingKitDiagnostics', JSON.stringify(existing));

  form.hidden = true;
  successBlock.hidden = false;
});
