const express = require("express");
const router = express.Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createAttraction,
  getAllAttractions,
  getAttractionById,
  updateAttractionById,
  deleteAttractionById,
  upsertTimeSlots,
  getTimeSlots,
  toggleAttractionStatus,
} = require("../../controllers/attraction.controller/attractionsController");
const {
  createAttractionBooking,
  getMyAttractionBookings,
  getAttractionBookingById,
  scanAttractionTicket,
  getAttractionBookingsAdmin,
} = require("../../controllers/attraction.controller/bookingController");

router.use(authenticate);

// ─────────────────────────────────────────────
// SWAGGER COMPONENTS
// ─────────────────────────────────────────────
/**
 * @openapi
 * components:
 *   schemas:
 *     AttractionTimeSlot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           example: "10:00"
 *         endTime:
 *           type: string
 *           example: "12:00"
 *         availableSpots:
 *           type: integer
 *         maxSpots:
 *           type: integer
 *         priceMultiplier:
 *           type: number
 *           example: 1.0
 *         specialPrice:
 *           type: number
 *           nullable: true
 *         effectivePrice:
 *           type: number
 *         isBlocked:
 *           type: boolean
 *         isHoliday:
 *           type: boolean
 *         isSoldOut:
 *           type: boolean
 *
 *     AttractionSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         category:
 *           type: string
 *         basePrice:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isBookable:
 *           type: boolean
 *         stats:
 *           type: object
 *           properties:
 *             averageRating:
 *               type: number
 *               nullable: true
 *             totalReviews:
 *               type: integer
 *             totalBookings:
 *               type: integer
 *
 *     AttractionBookingResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         attractionId:
 *           type: string
 *         timeSlotId:
 *           type: string
 *         numberOfPeople:
 *           type: integer
 *         visitorNames:
 *           type: array
 *           items:
 *             type: string
 *         pricePerPerson:
 *           type: number
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         totalPrice:
 *           type: number
 *         ticketNumber:
 *           type: string
 *         qrCode:
 *           type: string
 *           description: Base64 QR code for entry
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, REFUNDED]
 */

// ═══════════════════════════════════════════════════════
// ATTRACTION CRUD — static routes first
// ═══════════════════════════════════════════════════════

/**
 * @openapi
 * /attractions:
 *   get:
 *     tags: [Attractions]
 *     summary: Search and list all attractions
 *     description: Supports filtering by city, country, category, and keyword search.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         example: Lagos
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         example: Nigeria
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MUSEUM, PARK, HISTORICAL, BEACH, THEME_PARK, ZOO, LANDMARK, SHOPPING, TOUR, ENTERTAINMENT, WATER_PARK, AQUARIUM, ART_GALLERY, CONCERT_VENUE, SPORTS_VENUE, RELIGIOUS_SITE, NATURE_RESERVE]
 *       - in: query
 *         name: isBookable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search name, description, or city
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
 *         description: Attractions retrieved
 */
router.get("/", getAllAttractions);

/**
 * @openapi
 * /attractions:
 *   post:
 *     tags: [Attractions]
 *     summary: Create a new attraction (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, category, address, city, country, basePrice, openingHours]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lekki Conservation Centre
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [MUSEUM, PARK, HISTORICAL, BEACH, THEME_PARK, ZOO, LANDMARK, SHOPPING, TOUR, ENTERTAINMENT, WATER_PARK, AQUARIUM, ART_GALLERY, CONCERT_VENUE, SPORTS_VENUE, RELIGIOUS_SITE, NATURE_RESERVE]
 *                 example: PARK
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *                 example: Lagos
 *               country:
 *                 type: string
 *                 example: Nigeria
 *               latitude:
 *                 type: number
 *                 example: 6.4698
 *               longitude:
 *                 type: number
 *                 example: 3.5852
 *               openingHours:
 *                 type: string
 *                 example: "Mon-Sun 8:00AM - 5:00PM"
 *               basePrice:
 *                 type: number
 *                 example: 2500
 *               cancellationWindowHours:
 *                 type: integer
 *                 default: 24
 *               refundPercentage:
 *                 type: integer
 *                 default: 90
 *               maxCapacityPerSlot:
 *                 type: integer
 *                 default: 50
 *               averageDurationMinutes:
 *                 type: integer
 *                 default: 120
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               website:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Attraction created
 *       400:
 *         description: Invalid category or missing fields
 *       403:
 *         description: Admin access required
 */
router.post("/", restrictTo("admin"), createAttraction);

// ─── My Bookings (static, before /:attractionId) ───
/**
 * @openapi
 * /attractions/my-bookings:
 *   get:
 *     tags: [Attraction Bookings]
 *     summary: Get my attraction bookings
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
 *     responses:
 *       200:
 *         description: Bookings retrieved
 */
router.get("/my-bookings", getMyAttractionBookings);

// ─── Book an attraction (static, before /:attractionId) ───
/**
 * @openapi
 * /attractions/book:
 *   post:
 *     tags: [Attraction Bookings]
 *     summary: Book an attraction time slot
 *     description: |
 *       Books a specific time slot for an attraction.
 *       A **UnifiedBooking** is created automatically.
 *       Pricing = basePrice × priceMultiplier × numberOfPeople + 7.5% VAT + 2% service fee.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attractionId, timeSlotId, numberOfPeople]
 *             properties:
 *               attractionId:
 *                 type: string
 *                 format: uuid
 *               timeSlotId:
 *                 type: string
 *                 format: uuid
 *                 description: Get this from GET /attractions/{id}/slots
 *               numberOfPeople:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               visitorNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Must match numberOfPeople count
 *                 example: ["John Doe", "Jane Doe"]
 *               cartId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *           examples:
 *             simple:
 *               summary: Book for 2 people
 *               value:
 *                 attractionId: "uuid-here"
 *                 timeSlotId: "uuid-here"
 *                 numberOfPeople: 2
 *                 visitorNames: ["John Doe", "Jane Doe"]
 *     responses:
 *       201:
 *         description: Booking successful
 *       400:
 *         description: No spots available, advance booking rules violated
 *       404:
 *         description: Attraction or time slot not found
 */
router.post("/book", createAttractionBooking);

// ─── Ticket scan (staff/admin) ───
/**
 * @openapi
 * /attractions/scan/{ticketNumber}:
 *   patch:
 *     tags: [Attraction Bookings]
 *     summary: Scan a ticket for entry (staff/admin only)
 *     description: |
 *       Validates and scans a ticket for entry. Marks the booking as COMPLETED.
 *       Fails if already scanned, cancelled, or payment not confirmed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: TKT-ATR-M5X3K-AB12
 *     responses:
 *       200:
 *         description: Entry granted
 *       400:
 *         description: Already scanned, invalid status, or payment not confirmed
 *       404:
 *         description: Ticket not found
 */
router.patch(
  "/scan/:ticketNumber",
  restrictTo("admin", "staff"),
  scanAttractionTicket,
);

// ─── Booking by ID (static segment before /:attractionId) ───
/**
 * @openapi
 * /attractions/bookings/{bookingId}:
 *   get:
 *     tags: [Attraction Bookings]
 *     summary: Get attraction booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.get("/bookings/:bookingId", getAttractionBookingById);

// ═══════════════════════════════════════════════════════
// PARAMETERIZED ROUTES — after all statics
// ═══════════════════════════════════════════════════════

/**
 * @openapi
 * /attractions/{attractionId}:
 *   get:
 *     tags: [Attractions]
 *     summary: Get full attraction details
 *     description: Returns the full attraction with time slots, reviews, traveler photos, related attractions, and stats.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attraction found
 *       404:
 *         description: Not found
 */
router.get("/:attractionId", getAttractionById);

/**
 * @openapi
 * /attractions/{attractionId}:
 *   patch:
 *     tags: [Attractions]
 *     summary: Update attraction details (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: All fields optional — only send what you want to change
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               openingHours:
 *                 type: string
 *               isBookable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.patch("/:attractionId", restrictTo("admin"), updateAttractionById);

/**
 * @openapi
 * /attractions/{attractionId}:
 *   delete:
 *     tags: [Attractions]
 *     summary: Soft delete attraction (admin only)
 *     description: Blocked if there are upcoming confirmed bookings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Active bookings exist
 *       404:
 *         description: Not found
 */
router.delete("/:attractionId", restrictTo("admin"), deleteAttractionById);

/**
 * @openapi
 * /attractions/{attractionId}/status:
 *   patch:
 *     tags: [Attractions]
 *     summary: Toggle attraction active/inactive (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch(
  "/:attractionId/status",
  restrictTo("admin"),
  toggleAttractionStatus,
);

/**
 * @openapi
 * /attractions/{attractionId}/slots:
 *   get:
 *     tags: [Attractions]
 *     summary: Get available time slots for an attraction
 *     description: |
 *       Returns future time slots by default.
 *       Use the returned `id` (timeSlotId) when calling `POST /attractions/book`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Get slots for a specific date
 *         example: "2026-08-01"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start of date range
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End of date range
 *     responses:
 *       200:
 *         description: Time slots retrieved
 */
router.get("/:attractionId/slots", getTimeSlots);

/**
 * @openapi
 * /attractions/{attractionId}/slots:
 *   post:
 *     tags: [Attractions]
 *     summary: Create or update time slots (admin only)
 *     description: |
 *       Upserts time slots for an attraction. Uses `date + startTime` as the unique key —
 *       existing slots for the same date/time are updated, new ones are created.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
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
 *             required: [timeSlots]
 *             properties:
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [date, startTime, endTime]
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-08-01"
 *                     startTime:
 *                       type: string
 *                       example: "10:00"
 *                     endTime:
 *                       type: string
 *                       example: "12:00"
 *                     maxSpots:
 *                       type: integer
 *                       example: 30
 *                     priceMultiplier:
 *                       type: number
 *                       example: 1.5
 *                       description: 1.5 = 50% price increase for peak times
 *                     specialPrice:
 *                       type: number
 *                       nullable: true
 *                     isBlocked:
 *                       type: boolean
 *                     isHoliday:
 *                       type: boolean
 *           example:
 *             timeSlots:
 *               - date: "2026-08-01"
 *                 startTime: "10:00"
 *                 endTime: "12:00"
 *                 maxSpots: 30
 *               - date: "2026-08-01"
 *                 startTime: "14:00"
 *                 endTime: "16:00"
 *                 maxSpots: 30
 *                 priceMultiplier: 1.2
 *     responses:
 *       200:
 *         description: Time slots saved
 *       404:
 *         description: Attraction not found
 */
router.post("/:attractionId/slots", restrictTo("admin"), upsertTimeSlots);

/**
 * @openapi
 * /attractions/{attractionId}/bookings:
 *   get:
 *     tags: [Attraction Bookings]
 *     summary: Get all bookings for an attraction (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, REFUNDED]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Bookings retrieved
 */
router.get(
  "/:attractionId/bookings",
  restrictTo("admin"),
  getAttractionBookingsAdmin,
);

module.exports = router;
