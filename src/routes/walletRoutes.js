const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  payWithWallet,
  getWalletInfo,
  fundWallet,
  getTransactionByReference,
  claimWelcomeBonus,
} = require("../controllers/walletController");

router.use(authenticate);

router.post("/pay", payWithWallet);
router.get("/info", getWalletInfo);
router.post("/fund", fundWallet);
router.post("/claim-bonus", claimWelcomeBonus);
router.get("/transactions/:reference", getTransactionByReference);

module.exports = router;
