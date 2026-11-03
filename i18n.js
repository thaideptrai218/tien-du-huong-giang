"use strict";
// Vietnamese-only strings used by script.js. Page copy lives directly in index.html.
const translations = {
  "music.play": "Bật nhạc nền",
  "music.pause": "Tạm dừng nhạc nền",
  "music.playing": "Đang phát nhạc",
  "music.error": "Nhạc chưa tải được · chạm để thử lại",
  "music.blocked": "Chạm vào thiệp để nhạc vang lên",
  "music.paused": "Đã tạm dừng · chạm để nghe tiếp",
  "countdown.arrived": "NGÀY CHUNG ĐÔI ĐÃ ĐẾN",
  "calendar.reminder": "Ngày mai hẹn gặp Tiến Du và Hương Giang!",
  "calendar.saved": "Mở tệp lịch vừa tải để lưu ngày hẹn của chúng mình nhé.",
  "gift.pending":
    "Gia đình đang cập nhật mã QR mừng cưới. Xin cảm ơn tấm lòng của bạn!",
  "rsvp.unavailable": "Phiếu xác nhận chưa sẵn sàng. Vui lòng thử lại sau.",
  "rsvp.requiredName": "Vui lòng nhập họ và tên.",
  "rsvp.requiredSide": "Vui lòng chọn khách nhà gái hoặc khách nhà trai.",
  "rsvp.offline":
    "Chưa có kết nối mạng. Thông tin vẫn được giữ trong form; vui lòng thử lại khi có mạng.",
  "rsvp.sending": "Đang gửi xác nhận…",
  "rsvp.result": "Vui lòng xem kết quả gửi ở khung bên dưới.",
  "rsvp.timeout":
    "Chưa hiển thị được kết quả. Vui lòng kiểm tra khung bên dưới trước khi gửi lại.",
};
window.WEDDING_I18N = Object.freeze({
  language: "vi",
  t: (key) => translations[key] ?? key,
});
