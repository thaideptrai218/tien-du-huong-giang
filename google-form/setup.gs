/**
 * Run setupWeddingRsvp once at script.google.com while signed into your Google account.
 * Creates a Google Form and a private response spreadsheet owned by that account.
 * Run again in the SAME Apps Script project to retrieve the existing links.
 */
function setupWeddingRsvp() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var settings = PropertiesService.getScriptProperties();
    var formId = settings.getProperty('WEDDING_FORM_ID');
    var form = formId
      ? FormApp.openById(formId)
      : FormApp.create('Xác nhận tham dự · Tiến Du & Hương Giang · 16-17.11.2026', false);
    settings.setProperty('WEDDING_FORM_ID', form.getId());

    var sheetId = settings.getProperty('WEDDING_SHEET_ID');
    var spreadsheet = sheetId
      ? SpreadsheetApp.openById(sheetId)
      : SpreadsheetApp.create('Khách mời · Tiến Du & Hương Giang · 16-17.11.2026');
    if (!sheetId) spreadsheet.getSheets()[0].setName('Tổng hợp');
    settings.setProperty('WEDDING_SHEET_ID', spreadsheet.getId());

    if (settings.getProperty('WEDDING_SETUP_COMPLETE') !== 'true') {
      form.setDescription(
        'Trân trọng kính mời đến chung vui cùng gia đình chúng tôi.\n\n' +
        'Tiệc cưới 10h30 · Nhà gái: Thứ Hai 16.11.2026 · Nhà trai: Thứ Ba 17.11.2026\n' +
        'Trung tâm giải trí Sao Mai\n' +
        'Số 3 An Dương Vương, Tổ 4, P. Hòa Bình, Phú Thọ\n\n' +
        'Lời xác nhận tham dự giúp gia đình chuẩn bị đón tiếp chu đáo. ' +
        'Thông tin chỉ dùng để sắp xếp tiệc cưới.'
      );
      form.setCollectEmail(false);
      form.setLimitOneResponsePerUser(false);
      form.setPublishingSummary(false);
      form.setAllowResponseEdits(false);
      form.setShowLinkToRespondAgain(false);
      form.setShuffleQuestions(false);
      form.setProgressBar(true);
      form.setConfirmationMessage(
        'Lời xác nhận tham dự đã được ghi nhận. ' +
        'Trân trọng cảm ơn những tình cảm dành cho Du & Giang!'
      );

      // Find by title so retrying an interrupted setup does not duplicate questions.
      function existing(title) {
        return form.getItems().filter(function (item) {
          return item.getTitle() === title;
        })[0];
      }
      var nameTitle = 'Họ và tên';
      var nameItem = existing(nameTitle);
      (nameItem ? nameItem.asTextItem() : form.addTextItem().setTitle(nameTitle))
        .setRequired(true);

      var attendanceTitle = 'Xác nhận tham dự';
      var attendanceItem = existing(attendanceTitle);
      var attendance = attendanceItem
        ? attendanceItem.asMultipleChoiceItem()
        : form.addMultipleChoiceItem().setTitle(attendanceTitle);
      attendance.setRequired(true);

      var guestsPageTitle = 'Thông tin tham dự';
      var guestsPageItem = existing(guestsPageTitle);
      var guestsPage = guestsPageItem
        ? guestsPageItem.asPageBreakItem()
        : form.addPageBreakItem().setTitle(guestsPageTitle);
      var countTitle = 'Số người tham dự';
      var countItem = existing(countTitle);
      (countItem ? countItem.asListItem() : form.addListItem().setTitle(countTitle))
        .setHelpText('Vui lòng tính cả người điền trong tổng số người tham dự.')
        .setChoiceValues(['1', '2', '3', '4', '5'])
        .setRequired(true);

      var wishesPageTitle = 'Một chút yêu thương';
      var wishesPageItem = existing(wishesPageTitle);
      var wishesPage = wishesPageItem
        ? wishesPageItem.asPageBreakItem()
        : form.addPageBreakItem().setTitle(wishesPageTitle);
      var wishTitle = 'Lời nhắn dành cho Du & Giang';
      var wishItem = existing(wishTitle);
      (wishItem ? wishItem.asParagraphTextItem() : form.addParagraphTextItem().setTitle(wishTitle))
        .setRequired(false);
      attendance.setChoices([
        attendance.createChoice('Sẽ tham dự', guestsPage),
        attendance.createChoice('Không thể tham dự', wishesPage)
      ]);

      spreadsheet.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
      // Google may insert the response tab at index 0: never write by tab position.
      var summary = spreadsheet.getSheetByName('Tổng hợp') || spreadsheet.insertSheet('Tổng hợp');
      // A new Form throws here until its first response destination is linked.
      var destinationId = null;
      try {
        destinationId = form.getDestinationId();
      } catch (error) {
        // Only this expected first-run state is safe to recover from.
        // Permission or service failures must not silently replace a destination.
        if (!/no response destination/i.test(String(error))) throw error;
      }
      if (destinationId !== spreadsheet.getId()) {
        form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
      }
      SpreadsheetApp.flush();
      summary.getRange('A1:B5').setValues([
        ['THẾ NGỌC & HƯƠNG LY', '07.11.2026'],
        ['Phản hồi sẽ tự lưu ở tab câu trả lời bên cạnh.', ''],
        ['Số phản hồi', ''],
        ['Số lời xác nhận tham dự', ''],
        ['Tổng số khách sẽ đến', '']
      ]);
      var responseSheet = spreadsheet.getSheets().filter(function (sheet) {
        return sheet.getSheetId() !== summary.getSheetId();
      })[0];
      if (responseSheet) {
        var tab = "'" + responseSheet.getName().replace(/'/g, "''") + "'!";
        summary.getRange('B3').setFormula('=COUNTA(' + tab + 'B2:B)');
        summary.getRange('B4').setFormula('=COUNTIF(' + tab + 'C2:C,"Sẽ tham dự")');
        summary.getRange('B5').setFormula('=SUMIF(' + tab + 'C2:C,"Sẽ tham dự",' + tab + 'D2:D)');
      }
      summary.getRange('A1:B1').setBackground('#203a49').setFontColor('#ffffff').setFontWeight('bold');
      summary.setColumnWidth(1, 440);
      summary.setColumnWidth(2, 170);
      summary.setFrozenRows(1);

      if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
      form.setAcceptingResponses(true);
      settings.setProperty('WEDDING_SETUP_COMPLETE', 'true');
    }

    console.log('LINK ĐỂ KHÁCH ĐIỀN (gửi link này để gắn vào website):\n' + form.getPublishedUrl());
    console.log('LINK QUẢN LÝ FORM — GIỮ RIÊNG:\n' + form.getEditUrl());
    console.log('BẢNG PHẢN HỒI — GIỮ RIÊNG:\n' + spreadsheet.getUrl());
    console.log('KẾT NỐI WEBSITE: gửi LINK ĐỂ KHÁCH ĐIỀN ở trên để cấu hình đường dẫn và mã các trường cho form trên thiệp.');
  } finally {
    lock.releaseLock();
  }
}
