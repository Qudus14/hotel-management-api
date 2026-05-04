const { prisma } = require("../../config/db");

const createAddOn = async (req, res) => {
  try {
    const { type, name, price } = req.body;
    const newAddOn = await prisma.addOn.create({
      data: {
        type: type.toUpperCase(), // BAGGAGE, MEAL, etc.
        name,
        price: parseFloat(price),
      },
    });
    res.status(201).json(newAddOn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAddOns = async (req, res) => {
  const addOns = await prisma.addOn.findMany();
  res.status(200).json(addOns);
};

module.exports = { createAddOn, getAllAddOns };
