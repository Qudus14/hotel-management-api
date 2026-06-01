const router = require("express").Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createAirline,
  getAllAirlines,
  getAirlineById,
  updateAirlineById,
  reviewAirline,
  deleteAirlineById,
} = require("../../controllers/flight.controller/airlineController");

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Airline:
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
 *           example: Air Peace
 *         iataCode:
 *           type: string
 *           example: P4
 *           description: 2-letter IATA airline designator (unique)
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/logos/airpeace.png
 *         description:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           example: true
 *         isApproved:
 *           type: boolean
 *           example: false
 *           description: Set to true by admin after review
 *         vendor:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             businessName:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /flight/airlines:
 *   get:
 *     tags: [Airlines]
 *     summary: Get all airlines
 *     description: |
 *       Returns a paginated list of airlines.
 *       Supports filtering by status and search by name or IATA code.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by airline name or IATA code
 *         example: Air Peace
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
 *         description: Airlines retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAllAirlines);

/**
 * @openapi
 * /flight/airlines:
 *   post:
 *     tags: [Airlines]
 *     summary: Create a new airline (vendor or admin)
 *     description: |
 *       Creates an airline linked to an existing **AIRLINE-type vendor**.
 *       The airline starts as **pending approval** (`isApproved: false`).
 *       Admin must call `PATCH /flight/airlines/{airlineId}/review` to approve it
 *       before it can host planes and flights.
 *
 *       **Creation flow:**
 *       1. `POST /flight/airlines` → create airline (pending)
 *       2. `PATCH /flight/airlines/{id}/review` → admin approves
 *       3. `POST /flight/airplanes` → add planes to the airline
 *       4. `POST /flight/trip` → create flights using planeId
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendorId, name, iataCode]
 *             properties:
 *               vendorId:
 *                 type: string
 *                 format: uuid
 *                 description: Must be a vendor with vendorType = AIRLINE
 *               name:
 *                 type: string
 *                 example: Air Peace
 *               iataCode:
 *                 type: string
 *                 example: P4
 *                 description: 2-letter IATA code — must be globally unique
 *               logoUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://cdn.example.com/logos/airpeace.png
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Nigeria's largest domestic carrier
 *     responses:
 *       201:
 *         description: Airline created and awaiting approval
 *       400:
 *         description: Vendor is not of type AIRLINE or missing vendorId
 *       404:
 *         description: Vendor not found
 *       409:
 *         description: IATA code already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/", createAirline);

/**
 * @openapi
 * /flight/airlines/{airlineId}:
 *   get:
 *     tags: [Airlines]
 *     summary: Get airline by ID
 *     description: Returns full airline details including vendor info and associated planes count.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airlineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Airline found
 *       404:
 *         description: Airline not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:airlineId", getAirlineById);

/**
 * @openapi
 * /flight/airlines/{airlineId}:
 *   patch:
 *     tags: [Airlines]
 *     summary: Update airline details (vendor or admin)
 *     description: |
 *       Vendors can only update their own airline's name, IATA code, logo, and description.
 *       Only admins can toggle `isActive`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airlineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Air Peace International
 *               iataCode:
 *                 type: string
 *                 example: P4
 *               logoUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 description: Admin only — activates or deactivates the airline
 *     responses:
 *       200:
 *         description: Airline updated successfully
 *       403:
 *         description: Access denied — vendor trying to update another vendor's airline
 *       404:
 *         description: Airline not found
 *       409:
 *         description: IATA code already in use
 *       401:
 *         description: Unauthorized
 */
router.patch("/:airlineId", updateAirlineById);

/**
 * @openapi
 * /flight/airlines/{airlineId}/review:
 *   patch:
 *     tags: [Airlines]
 *     summary: Approve or reject an airline (admin only)
 *     description: |
 *       Admin reviews a newly submitted airline.
 *       - **approve**: sets `isApproved = true`, `isActive = true`
 *       - **reject**: sets `isApproved = false`, `isActive = false`
 *
 *       Only approved airlines can have flights created under them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airlineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               reason:
 *                 type: string
 *                 description: Required when action is "reject"
 *                 example: Incomplete documentation submitted
 *           examples:
 *             approve:
 *               summary: Approve airline
 *               value:
 *                 action: approve
 *             reject:
 *               summary: Reject airline
 *               value:
 *                 action: reject
 *                 reason: IATA code could not be verified
 *     responses:
 *       200:
 *         description: Airline approved or rejected successfully
 *       400:
 *         description: Invalid action or missing rejection reason
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Airline not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:airlineId/review", restrictTo("admin"), reviewAirline);

/**
 * @openapi
 * /flight/airlines/{airlineId}:
 *   delete:
 *     tags: [Airlines]
 *     summary: Delete an airline (admin only)
 *     description: |
 *       Permanently deletes an airline.
 *       **Blocked** if the airline has any associated flights.
 *       Use `PATCH /flight/airlines/{id}` to set `isActive: false` instead.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airlineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Airline deleted successfully
 *       400:
 *         description: Cannot delete — airline has associated flights
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Airline not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:airlineId", restrictTo("admin"), deleteAirlineById);

module.exports = router;
