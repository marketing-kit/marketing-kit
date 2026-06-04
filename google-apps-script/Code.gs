/**
 * Marketing Kit — приём заявок с сайта
 *
 * Настройка (один раз):
 * 1. Создайте Google Таблицу: https://sheets.new
 * 2. Расширения → Apps Script → вставьте этот код → сохраните
 * 3. Запустите setupSheet (▶) и разрешите доступ
 * 4. Развернуть → Новое развертывание → Веб-приложение
 *    - Запуск от имени: Я
 *    - Доступ: Все
 * 5. Скопируйте URL и вставьте в script.js → FORM_HANDLER_URL
 */

const EMAIL_TO = 'e.marketing.kit.agency@gmail.com';
const SHEET_NAME = 'Заявки';

const HEADERS = [
  'Дата',
  'Имя',
  'Email',
  'Канал связи',
  'Контакт',
  'Сфера бизнеса',
  'Что беспокоит',
  'Маркетинговая система',
  'Основной запрос',
];

function setupSheet() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.getDataAsString());
    const sheet = getSheet_();
    const submittedAt = data.submitted_at ? new Date(data.submitted_at) : new Date();

    sheet.appendRow([
      submittedAt,
      data.name || '',
      data.email || '',
      data.contact_channel || '',
      data.contact || '',
      data.sphere || '',
      data.concern || '',
      data.marketing_system || '',
      data.request || '',
    ]);

    const subject = 'Новая заявка на диагностику — Marketing Kit';
    const body = [
      'Новая заявка с сайта marketing-kit.github.io',
      '',
      `Дата: ${Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm')}`,
      `Имя: ${data.name || '—'}`,
      `Email: ${data.email || '—'}`,
      `Контакт (${data.contact_channel || '—'}): ${data.contact || '—'}`,
      `Сфера бизнеса: ${data.sphere || '—'}`,
      `Что беспокоит: ${data.concern || '—'}`,
      `Маркетинговая система: ${data.marketing_system || '—'}`,
      '',
      'Основной запрос:',
      data.request || '—',
    ].join('\n');

    MailApp.sendEmail(EMAIL_TO, subject, body);

    return json_({ success: true });
  } catch (error) {
    return json_({ success: false, error: String(error) });
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
