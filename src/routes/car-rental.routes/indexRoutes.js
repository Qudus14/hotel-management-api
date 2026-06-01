const express = require("express");
const router = express.Router();
const {
  createCarStore,
  getAllCarStores,
  getCarStoreById,
  getMyCarStore,
  updateCarStore,
  deleteCarStore,
} = require("../../controllers/car-rental.controller/indexController");

// Access control middlewares
const { restrictTo } = require("../../middleware/auth");

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CarStoreRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Apex Wheels Rental"
 *         description:
 *           type: string
 *           example: "Premium and luxury car rental services."
 *         address:
 *           type: string
 *           example: "12 Admiralty Way"
 *         city:
 *           type: string
 *           example: "Lekki"
 *         state:
 *           type: string
 *           example: "Lagos"
 *         latitude:
 *           type: number
 *           example: 6.4281
 *         longitude:
 *           type: number
 *           example: 3.4219
 *         phoneNumber:
 *           type: string
 *           example: "+2348012345678"
 *         email:
 *           type: string
 *           example: "contact@apexwheels.com"
 *         website:
 *           type: string
 *           example: "https://apexwheels.com"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             example: "https://cdn.photos/store1.jpg"
 */

/**
 * @openapi
 * /car-stores:
 *   get:
 *     tags:
 *       - Car Store
 *     summary: Retrieve all active and approved car stores (Public search)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated car stores list retrieved successfully.
 *       500:
 *         description: Internal server error.
 */
router.get("/", getAllCarStores);

/**
 * @openapi
 * /car-stores/vendor/me:
 *   get:
 *     tags:
 *       - Car Store
 *     summary: Get logged-in vendor's own car store profile dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor car store properties fetched successfully.
 *       404:
 *         description: Profile or store layout record not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/vendor/me", restrictTo("vendor"), getMyCarStore); // Added protect before restrictTo

/**
 * @openapi
 * /car-stores/{storeId}:
 *   get:
 *     tags:
 *       - Car Store
 *     summary: Retrieve a single car store details by ID (Public)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car store matching path ID successfully found.
 *       404:
 *         description: Car store matching path ID not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:storeId", getCarStoreById);

/**
 * @openapi
 * /car-stores:
 *   post:
 *     tags:
 *       - Car Store
 *     summary: Create a new car store (Vendors only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarStoreRequest'
 *     responses:
 *       201:
 *         description: Car Store created successfully. Awaiting admin approval.
 *       400:
 *         description: Missing core criteria payloads.
 *       403:
 *         description: Unauthorized role permissions.
 *       409:
 *         description: Vendor already operates an existing car store.
 *       500:
 *         description: Internal server error.
 */
router.post("/", restrictTo("vendor"), createCarStore); // Added protect before restrictTo

/**
 * @openapi
 * /car-stores/{storeId}:
 *   put:
 *     tags:
 *       - Car Store
 *     summary: Update an existing car store profile details (Vendor/Admin)
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
 *             $ref: '#/components/schemas/CarStoreRequest'
 *     responses:
 *       200:
 *         description: Car store fields updated successfully.
 *       404:
 *         description: Access denied or car store target profile not found.
 *       500:
 *         description: Internal server error.
 */
router.put("/:storeId", restrictTo("vendor", "admin"), updateCarStore); // Added protect before restrictTo

/**
 * @openapi
 * /car-stores/{storeId}:
 *   delete:
 *     tags:
 *       - Car Store
 *     summary: Deactivate/Soft-delete a car store (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car store field flag toggled to inactive successfully.
 *       404:
 *         description: Target profile not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:storeId", restrictTo("admin"), deleteCarStore);

module.exports = router;
