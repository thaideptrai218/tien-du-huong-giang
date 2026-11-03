// Published respondent URL and field ids read from the Google Form made by google-form/setup.gs.
// If the Form is recreated these must be updated, or the send button stays locked.
// Never put an editor URL, response spreadsheet URL or credentials in this file.
window.WEDDING_RSVP = Object.freeze({
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf2PuZcvsutySM-3BKx37r7Y5gB-z1L19NdUWkEsSKV6HVbRg/viewform",
  entries: Object.freeze({
    name: "entry.878309820",
    side: "entry.995304628",
    attendance: "entry.1587880743",
    guests: "entry.1175361885",
    wish: "entry.1711204273",
  }),
});
// Wedding-gift QR images, e.g. "assets/qr/nha-trai.jpg". Empty = the box shows a thank-you note.
window.WEDDING_GIFTS = Object.freeze({
  groom: "assets/qr/nha-trai.jpg",
  bride: "assets/qr/nha-gai.jpg",
});
