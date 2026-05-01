// walletRoutes.js
const express = require("express");
const router = express.Router();
const {
  payWithWallet,
  getWalletInfo,
  fundWallet,
  getTransactionByReference,
  claimWelcomeBonus,
} = require("../controllers/walletController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);

/**
 * @openapi
 * /wallet/info:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet balance and info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet info retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/info", getWalletInfo);

/**
 * @openapi
 * /wallet/transactions/{reference}:
 *   get:
 *     tags: [Wallet]
 *     summary: Get transaction by reference
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/transactions/:reference", getTransactionByReference);

/**
 * @openapi
 * /wallet/fund/{userId}:
 *   post:
 *     tags: [Wallet]
 *     summary: Admin funding or debiting of a user wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, action]
 *             properties:
 *               amount:
 *                 type: number
 *               action:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *       403:
 *         description: Forbidden - Admin only
 */
router.post("/fund/:userId", authenticate, restrictTo("admin"), fundWallet);

/**
 * @openapi
 * /wallet/pay:
 *   post:
 *     tags: [Wallet]
 *     summary: Pay for a booking with wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, paymentMethod]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "f9eda454-be45-4dd2-b434-86ee33089f6c"
 *               paymentMethod:
 *                 type: string
 *                 enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CASH, WALLET]
 *                 example: "WALLET"
 *               idempotencyKey:
 *                 type: string
 *                 description: Optional key to prevent duplicate payments
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Invalid payment method or insufficient balance
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/pay", payWithWallet);

/**
 * @openapi
 * /wallet/claim-bonus:
 *   post:
 *     tags: [Wallet]
 *     summary: Claim one-time welcome bonus
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome bonus claimed successfully
 *       400:
 *         description: Bonus already claimed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/claim-bonus", claimWelcomeBonus);

module.exports = router;
