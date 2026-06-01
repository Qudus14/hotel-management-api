const express = require("express");
const router = express.Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createAttractionOperator,
  getAllAttractionOperators,
  getAttractionOperatorById,
  updateAttractionOperator,
  reviewAttractionOperator,
  deleteAttractionOperator,
} = require("../../controllers/attraction.controller/operatorController");

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     AttractionOperator:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         vendorId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Lagos State Parks Agency"
 *         description:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         isApproved:
 *           type: boolean
 *         vendor:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             businessName:
 *               type: string
 *             businessEmail:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *         _count:
 *           type: object
 *           properties:
 *             attractions:
 *               type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOperatorRequest:
 *       type: object
 *       required:
 *         - vendorId
 *         - name
 *       properties:
 *         vendorId:
 *           type: string
 *           format: uuid
 *           description: "Vendor ID (must be vendorType = ATTRACTION)"
 *         name:
 *           type: string
 *           example: "Lagos State Parks Agency"
 *         description:
 *           type: string
 *
 *     UpdateOperatorRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *           description: "Admin only"
 *
 *     ReviewOperatorRequest:
 *       type: object
 *       required:
 *         - isApproved
 *       properties:
 *         isApproved:
 *           type: boolean
 *           description: "true = approve, false = reject"
 */

// ═══════════════════════════════════════════════════════
// OPERATOR CRUD ROUTES
// ═══════════════════════════════════════════════════════

/**
 * @openapi
 * /attractions/operators:
 *   post:
 *     tags: [Attraction Operators]
 *     summary: Create a new attraction operator (vendor only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOperatorRequest'
 *     responses:
 *       201:
 *         description: Operator created and awaiting approval
 *       400:
 *         description: Vendor is not of type ATTRACTION or missing fields
 *       404:
 *         description: Vendor not found
 */
router.post("/", createAttractionOperator);

/**
 * @openapi
 * /attractions/operators:
 *   get:
 *     tags: [Attraction Operators]
 *     summary: Get all attraction operators
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Operators retrieved successfully
 */
router.get("/", getAllAttractionOperators);

/**
 * @openapi
 * /attractions/operators/{operatorId}:
 *   get:
 *     tags: [Attraction Operators]
 *     summary: Get operator by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Operator found
 *       404:
 *         description: Operator not found
 */
router.get("/:operatorId", getAttractionOperatorById);

/**
 * @openapi
 * /attractions/operators/{operatorId}:
 *   patch:
 *     tags: [Attraction Operators]
 *     summary: Update operator details (vendor or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOperatorRequest'
 *     responses:
 *       200:
 *         description: Operator updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Operator not found
 */
router.patch("/:operatorId", updateAttractionOperator);

/**
 * @openapi
 * /attractions/operators/{operatorId}/review:
 *   patch:
 *     tags: [Attraction Operators]
 *     summary: Approve or reject an operator (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewOperatorRequest'
 *     responses:
 *       200:
 *         description: Operator approved or rejected successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Operator not found
 */
router.patch(
  "/:operatorId/review",
  restrictTo("admin"),
  reviewAttractionOperator,
);

/**
 * @openapi
 * /attractions/operators/{operatorId}:
 *   delete:
 *     tags: [Attraction Operators]
 *     summary: Delete an operator (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Operator deleted successfully
 *       400:
 *         description: Cannot delete — operator has associated attractions
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Operator not found
 */
router.delete("/:operatorId", restrictTo("admin"), deleteAttractionOperator);

module.exports = router;
