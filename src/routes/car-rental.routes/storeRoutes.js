const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  addPickupLocation,
  getPickupLocations,
  updatePickupLocation,
  deletePickupLocation,
  addCarCategory,
  getCarCategories,
  updateCarCategory,
  deleteCarCategory,
} = require("../../controllers/car-rental.controller/storeController");
const { restrictTo } = require("../../middleware/auth");

// ═══════════════════════════════════════════════════════════════
// SWAGGER SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * components:
 *   schemas:
 *     PickupLocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         carStoreId:
 *           type: string
 *         name:
 *           type: string
 *           example: Murtala Mohammed Airport Terminal 1
 *         address:
 *           type: string
 *           example: Airport Road, Ikeja, Lagos
 *         latitude:
 *           type: number
 *           example: 6.5774
 *         longitude:
 *           type: number
 *           example: 3.3212
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreatePickupLocationInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Murtala Mohammed Airport Terminal 1
 *         address:
 *           type: string
 *           example: Airport Road, Ikeja, Lagos
 *         latitude:
 *           type: number
 *           example: 6.5774
 *         longitude:
 *           type: number
 *           example: 3.3212
 *
 *     UpdatePickupLocationInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         isActive:
 *           type: boolean
 *
 *     CarCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         carStoreId:
 *           type: string
 *         name:
 *           type: string
 *           example: SUV
 *         description:
 *           type: string
 *           example: Spacious SUVs for family trips
 *         pricePerDay:
 *           type: number
 *           example: 35000
 *         imageUrl:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCarCategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - pricePerDay
 *       properties:
 *         name:
 *           type: string
 *           example: SUV
 *         description:
 *           type: string
 *           example: Spacious SUVs for family trips
 *         pricePerDay:
 *           type: number
 *           example: 35000
 *         imageUrl:
 *           type: string
 *           example: https://cdn.example.com/suv.jpg
 *
 *     UpdateCarCategoryInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         pricePerDay:
 *           type: number
 *         imageUrl:
 *           type: string
 */

// ═══════════════════════════════════════════════════════════════
// PICKUP LOCATION ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   - name: Pickup Locations
 *     description: Manage pickup/dropoff locations for a car store
 *   - name: Car Categories
 *     description: Manage car categories and pricing tiers for a car store
 */

/**
 * @swagger
 * /car-store/stores/{storeId}/pickup-locations:
 *   get:
 *     summary: Get all pickup locations for a store (public)
 *     tags: [Pickup Locations]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car store UUID
 *     responses:
 *       200:
 *         description: List of pickup locations
 *       404:
 *         description: Car store not found
 */
router.get("/pickup-locations", getPickupLocations);

/**
 * @swagger
 * /car-store/stores/{storeId}/pickup-locations:
 *   post:
 *     summary: Add a pickup location to a store (vendor only)
 *     tags: [Pickup Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePickupLocationInput'
 *     responses:
 *       201:
 *         description: Pickup location created
 *       400:
 *         description: name is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Vendor or store not found
 */
router.post("/pickup-locations", restrictTo("vendor"), addPickupLocation);

/**
 * @swagger
 * /car-store/stores/{storeId}/pickup-locations/{locationId}:
 *   patch:
 *     summary: Update a pickup location (vendor only)
 *     tags: [Pickup Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePickupLocationInput'
 *     responses:
 *       200:
 *         description: Pickup location updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Location not found
 */
router.patch(
  "/pickup-locations/:locationId",
  restrictTo("vendor"),
  updatePickupLocation,
);

/**
 * @swagger
 * /car-store/stores/{storeId}/pickup-locations/{locationId}:
 *   delete:
 *     summary: Deactivate a pickup location (vendor only)
 *     tags: [Pickup Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pickup location deactivated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Location not found
 *       409:
 *         description: Cars are still assigned to this location
 */
router.delete(
  "/pickup-locations/:locationId",
  restrictTo("vendor"),
  deletePickupLocation,
);

// ═══════════════════════════════════════════════════════════════
// CAR CATEGORY ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /car-store/stores/{storeId}/categories:
 *   get:
 *     summary: Get all categories for a store (public)
 *     tags: [Car Categories]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of categories
 *       404:
 *         description: Car store not found
 */
router.get("/categories", getCarCategories);

/**
 * @swagger
 * /car-store/stores/{storeId}/categories:
 *   post:
 *     summary: Create a car category for a store (vendor only)
 *     tags: [Car Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarCategoryInput'
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: name and pricePerDay are required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Vendor or store not found
 *       409:
 *         description: Category name already exists in this store
 */
router.post("/categories", restrictTo("vendor"), addCarCategory);

/**
 * @swagger
 * /car-store/stores/{storeId}/categories/{categoryId}:
 *   patch:
 *     summary: Update a car category (vendor only)
 *     tags: [Car Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCarCategoryInput'
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Category not found
 */
router.patch(
  "/categories/:categoryId",
  restrictTo("vendor"),
  updateCarCategory,
);

/**
 * @swagger
 * /car-store/stores/{storeId}/categories/{categoryId}:
 *   delete:
 *     summary: Delete a car category (vendor only)
 *     tags: [Car Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cars are still assigned to this category
 */
router.delete(
  "/categories/:categoryId",
  restrictTo("vendor"),
  deleteCarCategory,
);

module.exports = router;
