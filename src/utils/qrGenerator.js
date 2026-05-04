const QRCode = require("qrcode");

const generateBoardingQR = async (bookingId) => {
  // Encodes the booking ID into a Base64 image string
  return await QRCode.toDataURL(`BOARDING_PASS_${bookingId}`);
};

module.exports = {
  generateBoardingQR,
};
