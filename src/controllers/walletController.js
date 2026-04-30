const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 💰 Pay for booking using virtual wallet
 */
exports.payWithWallet = async (req, res) => {
  const { bookingId, idempotencyKey, paymentMethod } = req.body; // ✅ Add paymentMethod
  const userId = req.user.sub;

  // ✅ Validate payment method
  const validPaymentMethods = [
    "CREDIT_CARD",
    "DEBIT_CARD",
    "PAYPAL",
    "BANK_TRANSFER",
    "CASH",
    "WALLET",
  ];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment method. Choose from: ${validPaymentMethods.join(
        ", ",
      )}`,
    });
  }

  // Check idempotency
  if (idempotencyKey) {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });
    if (existing && existing.status === "COMPLETED") {
      return res.status(200).json(JSON.parse(existing.response));
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { room: true },
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.userId !== userId)
        throw new Error("Unauthorized: Not your booking");
      if (booking.paymentStatus === "SUCCESSFUL")
        throw new Error("Booking already paid");
      if (booking.status !== "pending")
        throw new Error(
          `Cannot pay for booking with status: ${booking.status}`,
        );

      const user = await tx.user.findUnique({ where: { id: userId } });
      const totalPrice = parseFloat(booking.totalPrice);

      if (user.walletBalance < totalPrice) {
        throw new Error(
          `Insufficient balance. Need ₦${totalPrice.toLocaleString()}`,
        );
      }

      const oldBalance = user.walletBalance;
      const newBalance = oldBalance - totalPrice;

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "SUCCESSFUL",
          status: "confirmed",
        },
        include: { room: true },
      });

      // ✅ Use the payment method provided by user
      const payment = await tx.payment.create({
        data: {
          // Convert to string to ensure Prisma Decimal handles it correctly
          amount: totalPrice.toString(),
          currency: "NGN",
          status: "SUCCESSFUL",
          // Match the Enum exactly as defined in your schema
          paymentMethod: "WALLET",
          bookingId: bookingId,
          reference: `PAY-${Date.now()}-${userId.slice(0, 6)}`,
          paidAt: new Date(),
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount: totalPrice,
          type: "DEBIT",
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: `Payment for booking #${bookingId.slice(0, 8)} - Room ${
            booking.room.roomNumber
          } via ${paymentMethod}`,
          reference: payment.reference,
          bookingId,
        },
      });

      return {
        booking: updatedBooking,
        payment,
        transaction,
        oldBalance,
        newBalance,
      };
    });

    // Store idempotency result
    if (idempotencyKey) {
      await prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          status: "COMPLETED",
          response: JSON.stringify(result),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `✅ Payment successful via ${paymentMethod}!`,
      data: {
        bookingId: result.booking.id,
        roomNumber: result.booking.room.roomNumber,
        amountPaid: result.transaction.amount,
        paymentMethod: paymentMethod,
        oldBalance: result.oldBalance,
        newBalance: result.newBalance,
        transactionRef: result.transaction.reference,
      },
    });
  } catch (error) {
    console.error("Payment error:", error);

    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : error.message.includes("Insufficient")
          ? 400
          : error.message.includes("already paid")
            ? 400
            : error.message.includes("Cannot pay")
              ? 400
              : 500;

    res.status(statusCode).json({
      success: false,
      message:
        process.env.NODE_ENV === "production" && statusCode === 500
          ? "Payment processing failed"
          : error.message,
    });
  }
};

/**
 * 👛 Get wallet balance & transaction history
 */
exports.getWalletInfo = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [user, transactions, totalTransactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          walletBalance: true,
        },
      }),
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
        include: {
          booking: {
            select: {
              id: true,
              room: { select: { roomNumber: true } },
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where: { userId } }),
    ]);

    // Calculate statistics
    const stats = await prisma.walletTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    const totalSpent = await prisma.walletTransaction.aggregate({
      where: { userId, type: "DEBIT" },
      _sum: { amount: true },
    });

    const totalReceived = await prisma.walletTransaction.aggregate({
      where: { userId, type: "CREDIT" },
      _sum: { amount: true },
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          currentBalance: user.walletBalance,
        },
        statistics: {
          totalTransactions: totalTransactions,
          totalSpent: totalSpent._sum.amount || 0,
          totalReceived: totalReceived._sum.amount || 0,
        },
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceBefore: t.balanceBefore,
          balanceAfter: t.balanceAfter,
          description: t.description,
          reference: t.reference,
          bookingId: t.bookingId,
          roomNumber: t.booking?.room?.roomNumber,
          date: t.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet info",
    });
  }
};

/**
 * 💸 Fund wallet with virtual credits (Admin or Self)
 */
exports.fundWallet = async (req, res) => {
  try {
    const { amount, description, targetUserId } = req.body;
    const currentUserId = req.user.sub;
    const isAdmin = req.user.role === "admin";

    // Determine who gets the money
    const recipientId = isAdmin && targetUserId ? targetUserId : currentUserId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const recipient = await tx.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        throw new Error("Recipient not found");
      }

      const oldBalance = recipient.walletBalance;
      const newBalance = oldBalance + parseFloat(amount);

      await tx.user.update({
        where: { id: recipientId },
        data: { walletBalance: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId: recipientId,
          amount: parseFloat(amount),
          type: "CREDIT",
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: description || "Wallet funding",
          reference: `FUND-${Date.now()}-${recipientId.slice(0, 6)}`,
          fundedBy: isAdmin && targetUserId ? currentUserId : null,
          fundingReason: description,
        },
      });

      return { transaction, recipient, oldBalance, newBalance };
    });

    res.status(200).json({
      success: true,
      message: `✅ Successfully added ₦${amount.toLocaleString()} to ${
        result.recipient.name
      }'s wallet`,
      data: {
        recipient: result.recipient.name,
        amountAdded: parseFloat(amount),
        oldBalance: result.oldBalance,
        newBalance: result.newBalance,
        reference: result.transaction.reference,
      },
    });
  } catch (error) {
    console.error("Fund wallet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🎁 Claim welcome bonus (for new users)
 */
exports.claimWelcomeBonus = async (req, res) => {
  try {
    const userId = req.user.sub;

    // Check if user already claimed bonus
    const existingBonus = await prisma.walletTransaction.findFirst({
      where: {
        userId,
        type: "CREDIT",
        description: { contains: "Welcome bonus" },
      },
    });

    if (existingBonus) {
      return res.status(400).json({
        success: false,
        message: "Welcome bonus already claimed",
      });
    }

    const BONUS_AMOUNT = 5000; // ₦5,000 welcome bonus

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      const oldBalance = user.walletBalance;
      const newBalance = oldBalance + BONUS_AMOUNT;

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount: BONUS_AMOUNT,
          type: "CREDIT",
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: "🎁 Welcome bonus - Enjoy your stay!",
          reference: `WELCOME-${Date.now()}-${userId.slice(0, 6)}`,
          fundingReason: "Welcome bonus",
        },
      });

      return { transaction, oldBalance, newBalance };
    });

    res.status(200).json({
      success: true,
      message: `🎉 Welcome bonus of ₦${BONUS_AMOUNT.toLocaleString()} added to your wallet!`,
      data: {
        bonusAmount: BONUS_AMOUNT,
        oldBalance: result.oldBalance,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Welcome bonus error:", error);
    res.status(500).json({
      success: false,
      message: "Error claiming welcome bonus",
    });
  }
};

/**
 * 📜 Get single transaction by reference
 */
exports.getTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    const transaction = await prisma.walletTransaction.findUnique({
      where: { reference },
      include: {
        user: { select: { name: true, email: true } },
        booking: {
          include: { room: { select: { roomNumber: true } } },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transaction",
    });
  }
};

/**
 * 🔄 Admin: Reset/Clear all test data
 */
exports.resetTestData = async (req, res) => {
  try {
    // Only for testing!
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "Only available in development" });
    }

    await prisma.$transaction([
      prisma.walletTransaction.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.user.updateMany({
        data: { walletBalance: 10000 }, // Reset to default
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "✅ Test data reset. All users now have ₦10,000",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
