// Fill in after running google-form/setup.gs (see google-form/HUONG-DAN.txt).
// While formUrl is empty the send button stays locked, so no guest data leaves the page.
// Never put an editor URL, response spreadsheet URL or credentials in this file.
window.WEDDING_RSVP = Object.freeze({
  formUrl: "",
  entries: Object.freeze({
    name: "",
    side: "",
    attendance: "",
    guests: "",
    wish: "",
  }),
});
// Wedding-gift QR images, e.g. "assets/qr/nha-trai.jpg". Empty = the box shows a thank-you note.
window.WEDDING_GIFTS = Object.freeze({
  groom: "assets/qr/nha-trai.jpg",
  bride: "assets/qr/nha-gai.jpg",
});
