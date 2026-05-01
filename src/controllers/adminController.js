const { PrismaClient } = require("@prisma/client");
const { prisma } = require("../config/db");

/**
 * Get admin dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get counts for dashboard
    const [
      totalUsers,
      totalBookings,
      totalRooms,
      recentBookings,
      pendingBookings,
      checkedInToday,
      revenueStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.room.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          room: { select: { roomNumber: true, type: true } },
        },
      }),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({
        where: {
          status: "checked_in",
          actualCheckIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.booking.aggregate({
        where: {
          // OLD: status: { in: ["checked_in", "checked_out"] },
          // NEW: Count revenue for ANY successful payment, regardless of check-in status
          paymentStatus: "SUCCESSFUL",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          bookings: totalBookings,
          rooms: totalRooms,
          pendingBookings,
          checkedInToday,
        },
        recentBookings,
        revenueLast30Days: revenueStats._sum.totalPrice || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          address: true,
          walletBalance: true,
          profileImage: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      results: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get single user by ID (admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          include: {
            room: { select: { roomNumber: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Update user (admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phoneNumber, address, role } = req.body;

    // 1. Basic validation: Ensure we actually have an ID to query
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3. Email uniqueness check (only if email is being changed)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // 4. Build dynamic update object
    // Using Object.entries or a simple spread with checks is cleaner
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;

    // Ensure role matches your Prisma Enum (lowercase 'admin', 'customer', 'staff')
    if (role) updateData.role = role.toLowerCase();

    // 5. Execute Update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        walletBalance: true, // Useful to return for the Admin UI
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    // Handle Prisma specific errors (like invalid Enum values)
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Unique constraint failed" });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id: UserId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: UserId },
      include: { bookings: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await prisma.user.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot delete the last admin user",
        });
      }
    }

    // Delete user (cascade will handle bookings if set in schema)
    await prisma.user.delete({
      where: { id: UserId },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Get all bookings (admin only)
 */
const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, startDate, endDate } = req.query;

    const where = {};

    if (status) where.status = status;

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) where.checkInDate.gte = new Date(startDate);
      if (endDate) where.checkInDate.lte = new Date(endDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
          room: {
            select: { id: true, roomNumber: true, type: true, price: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      results: bookings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

/**
 * Update booking status (admin only)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus, actualCheckIn, actualCheckOut } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const updateData = { status, paymentStatus };

    if (status === "checked_in" && !actualCheckIn) {
      updateData.actualCheckIn = new Date();
    } else if (actualCheckIn) {
      updateData.actualCheckIn = new Date(actualCheckIn);
    }

    if (status === "checked_out" && !actualCheckOut) {
      updateData.actualCheckOut = new Date();
    } else if (actualCheckOut) {
      updateData.actualCheckOut = new Date(actualCheckOut);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { roomNumber: true, type: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

/**
 * Get revenue reports (admin only)
 */
const getRevenueReport = async (req, res) => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    let dateFilter = {};
    let groupBy = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Default to last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dateFilter.createdAt = { gte: sixMonthsAgo };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...dateFilter,
        paymentStatus: "SUCCESSFUL",
      },
      select: {
        totalPrice: true,
        createdAt: true,
        status: true,
      },
    });

    // Group by month
    const revenueByMonth = bookings.reduce((acc, booking) => {
      const month = booking.createdAt.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { revenue: 0, count: 0 };
      }
      acc[month].revenue += Number(booking.totalPrice);
      acc[month].count += 1;
      return acc;
    }, {});

    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.totalPrice),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalBookings: bookings.length,
        averageBookingValue: bookings.length
          ? totalRevenue / bookings.length
          : 0,
        revenueByMonth: Object.entries(revenueByMonth).map(([month, data]) => ({
          month,
          ...data,
        })),
      },
    });
  } catch (error) {
    console.error("Revenue report error:", error);
    res.status(500).json({ error: "Failed to generate revenue report" });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  updateBookingStatus,
  getRevenueReport,
};
