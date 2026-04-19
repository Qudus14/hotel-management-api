const bcrypt = require("bcrypt");
const { prisma } = require("../config/db");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { userSchema } = require("../model/usersModel");
const jwt = require("jsonwebtoken"); // FIXED: Correct import

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(userSchema);

const registerUser = async (req, res) => {
  try {
    const isValid = validate(req.body);
    if (!isValid) {
      return res.status(400).json({ errors: validate.errors });
    }

    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber: "",
        role: "customer",
      },
    });

    // Generate Token
    const token = jwt.sign(
      { sub: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const { password: _, ...userResponse } = newUser;

    // Send everything back
    res.status(201).json({
      message: "User registered successfully",
      token: token, // FIXED: Now sending the token to the client
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      // Use generic message so hackers don't know if the email exists
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Generate Token (No need to create a user here!)
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // 4. Strip password before sending response
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
