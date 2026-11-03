/**
 * Run setupWeddingRsvp at script.google.com while signed into your Google account.
 * Creates a one-page Google Form whose questions mirror the form on the invitation,
 * plus a private response spreadsheet that totals guests per family.
 * Running again in the SAME Apps Script project reuses them and reprints the links.
 *
 * Choice texts must stay identical to the values sent by script.js:
 * Google rejects a submission whose answer is not one of the form's choices.
 */
var RSVP = {
  name: 'Tên của bạn là?',
  side: 'Bạn là khách của?',
  sideChoices: ['Khách nhà trai', 'Khách nhà gái'],
  wish: 'Gửi lời chúc tới Dâu Rể nha!',
  attendance: 'Xác nhận tham dự',
  attendanceYes: 'Mình sẽ tham dự!',
  attendanceNo: 'Tiếc quá! Mình không tham dự được mất rồi!',
  guests: 'Số người tham dự'
};

function setupWeddingRsvp() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var settings = PropertiesService.getScriptProperties();
    // New keys: a project that ran the earlier multi-page form gets a clean Form and Sheet,
    // because a reused Sheet would keep the old columns and break the totals below.
    var formId = settings.getProperty('WEDDING_V2_FORM_ID');
    var form = formId
      ? FormApp.openById(formId)
      : FormApp.create('Xác nhận tham dự · Tiến Du & Hương Giang · 16-17.11.2026', false);
    settings.setProperty('WEDDING_V2_FORM_ID', form.getId());

    var sheetId = settings.getProperty('WEDDING_V2_SHEET_ID');
    var spreadsheet = sheetId
      ? SpreadsheetApp.openById(sheetId)
      : SpreadsheetApp.create('Khách mời · Tiến Du & Hương Giang · 16-17.11.2026');
    if (!sheetId) spreadsheet.getSheets()[0].setName('Tổng hợp');
    settings.setProperty('WEDDING_V2_SHEET_ID', spreadsheet.getId());

    if (settings.getProperty('WEDDING_V2_COMPLETE') !== 'true') {
      buildForm(form);
      linkSpreadsheet(form, spreadsheet);
      if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
      form.setAcceptingResponses(true);
      settings.setProperty('WEDDING_V2_COMPLETE', 'true');
    }

    console.log('GỬI LẠI TOÀN BỘ KHỐI NÀY ĐỂ GẮN VÀO THIỆP:\n' + websiteConfig(form));
    console.log('LINK QUẢN LÝ FORM — GIỮ RIÊNG:\n' + form.getEditUrl());
    console.log('BẢNG PHẢN HỒI — GIỮ RIÊNG:\n' + spreadsheet.getUrl());
  } finally {
    lock.releaseLock();
  }
}

function buildForm(form) {
  form.setDescription(
    'Vui lòng cho biết sự hiện diện của bạn tại sự kiện.\n\n' +
    'Tiệc cưới nhà gái: 10h30, Thứ Hai 16.11.2026\n' +
    'Tiệc cưới nhà trai: 10h30, Thứ Ba 17.11.2026\n' +
    'Tại Trung tâm giải trí Sao Mai, Số 3 An Dương Vương, Tổ 4, P. Hòa Bình, Phú Thọ'
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setPublishingSummary(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setShuffleQuestions(false);
  form.setConfirmationMessage(
    'Lời xác nhận của bạn đã được ghi nhận. ' +
    'Cảm ơn tình cảm của bạn dành cho Tiến Du & Hương Giang!'
  );

  // Clearing first lets an interrupted setup be retried without duplicate questions.
  form.getItems().forEach(function (item) {
    form.deleteItem(item);
  });
  form.addTextItem().setTitle(RSVP.name).setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle(RSVP.side)
    .setChoiceValues(RSVP.sideChoices)
    .setRequired(true);
  form.addParagraphTextItem().setTitle(RSVP.wish).setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle(RSVP.attendance)
    .setChoiceValues([RSVP.attendanceYes, RSVP.attendanceNo])
    .setRequired(true);
  // Optional, as on the invitation: guests who cannot come are not asked for a number.
  form.addListItem()
    .setTitle(RSVP.guests)
    .setHelpText('Chỉ chọn nếu bạn sẽ tham dự, tính cả người điền.')
    .setChoiceValues(['1', '2', '3', '4', '5'])
    .setRequired(false);
}

function linkSpreadsheet(form, spreadsheet) {
  spreadsheet.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  // Google may insert the response tab at index 0: never write by tab position.
  var summary = spreadsheet.getSheetByName('Tổng hợp') || spreadsheet.insertSheet('Tổng hợp');
  // A new Form throws here until its first response destination is linked.
  var destinationId = null;
  try {
    destinationId = form.getDestinationId();
  } catch (error) {
    // Only this expected first-run state is safe to recover from.
    if (!/no response destination/i.test(String(error))) throw error;
  }
  if (destinationId !== spreadsheet.getId()) {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  }
  SpreadsheetApp.flush();

  var responses = spreadsheet.getSheets().filter(function (sheet) {
    return sheet.getSheetId() !== summary.getSheetId();
  })[0];
  summary.getRange('A1:C1').setValues([['TIẾN DU & HƯƠNG GIANG', RSVP.sideChoices[0], RSVP.sideChoices[1]]]);
  summary.getRange('A2:A4').setValues([['Số phản hồi'], ['Số lời xác nhận sẽ tham dự'], ['Tổng số khách sẽ đến']]);
  if (responses) {
    // Response columns follow question order: A time, B name, C side, D wish, E attendance, F guests.
    var tab = "'" + responses.getName().replace(/'/g, "''") + "'!";
    ['B', 'C'].forEach(function (column) {
      var side = column + '$1';
      summary.getRange(column + '2').setFormula('=COUNTIF(' + tab + 'C2:C,' + side + ')');
      summary.getRange(column + '3').setFormula(
        '=COUNTIFS(' + tab + 'C2:C,' + side + ',' + tab + 'E2:E,"' + RSVP.attendanceYes + '")'
      );
      summary.getRange(column + '4').setFormula(
        '=SUMIFS(' + tab + 'F2:F,' + tab + 'C2:C,' + side + ',' + tab + 'E2:E,"' + RSVP.attendanceYes + '")'
      );
    });
  }
  summary.getRange('A1:C1').setBackground('#a81e30').setFontColor('#ffffff').setFontWeight('bold');
  summary.setColumnWidth(1, 260);
  summary.setColumnWidth(2, 150);
  summary.setColumnWidth(3, 150);
  summary.setFrozenRows(1);
}

// Prefilled links expose each question's entry id without submitting a response.
function websiteConfig(form) {
  var answers = {};
  answers[RSVP.name] = ['name', 'x'];
  answers[RSVP.side] = ['side', RSVP.sideChoices[0]];
  answers[RSVP.wish] = ['wish', 'x'];
  answers[RSVP.attendance] = ['attendance', RSVP.attendanceYes];
  answers[RSVP.guests] = ['guests', '1'];
  var config = { formUrl: form.getPublishedUrl(), entries: {} };
  form.getItems().forEach(function (item) {
    var answer = answers[item.getTitle()];
    var typed = item.getType() === FormApp.ItemType.TEXT ? item.asTextItem()
      : item.getType() === FormApp.ItemType.MULTIPLE_CHOICE ? item.asMultipleChoiceItem()
      : item.getType() === FormApp.ItemType.PARAGRAPH_TEXT ? item.asParagraphTextItem()
      : item.asListItem();
    var url = form.createResponse()
      .withItemResponse(typed.createResponse(answer[1]))
      .toPrefilledUrl();
    config.entries[answer[0]] = url.match(/entry\.\d+/)[0];
  });
  return JSON.stringify(config, null, 2);
}
