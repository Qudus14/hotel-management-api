// walletRoutes.js
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
 * /wallet/fund:
 *   post:
 *     tags: [Wallet]
 *     summary: Fund wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/fund", fundWallet);

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
 *             required: [amount, bookingId]
 *             properties:
 *               amount:
 *                 type: number
 *               bookingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Insufficient wallet balance
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
