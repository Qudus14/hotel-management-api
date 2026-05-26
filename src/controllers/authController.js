const bcrypt = require("bcrypt");
const { prisma } = require("../config/db");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { userSchema } = require("../model/usersModel");
const jwt = require("jsonwebtoken");

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(userSchema);

const registerUser = async (req, res) => {
  try {
    const isValid = validate(req.body);
    if (!isValid) {
      return res.status(400).json({ errors: validate.errors });
    }

    const { email, password, name, phoneNumber } = req.body;

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with null instead of empty string
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || null, // Use null instead of empty string
        role: "customer",
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        walletBalance: 0,
        kycStatus: "NOT_SUBMITTED",
      },
    });

    // Generate Token
    const token = jwt.sign(
      { sub: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      message: "User registered successfully",
      token: token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    // Handle unique constraint errors
    if (error.code === "P2002" && error.meta?.target?.includes("phoneNumber")) {
      return res.status(400).json({
        message: "Phone number already exists. Please use a different number.",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    const { password: _, ...userResponse } = user;

    res.status(200).json({
      message: "User login successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
