const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");
const asyncHandler = require("express-async-handler");
const calendarService = require("../services/googleCalendarService");
const moment = require("moment");
const config = require("../../config/general");

// ─── Mock data fixtures ──────────────────────────────────────────
const MOCK = {
  summary: "[TEST] DRDB Calendar Test Event",
  location: "Psychology Building, McMaster University",
  description:
    "<b>Note: </b>This is a test event from DRDB Calendar Test Console.<br>" +
    "=================<br>" +
    "<b>Infant Visual Attention Study</b><br>" +
    "<b>E1: </b>Alex Chen<br>" +
    "<b>E2: </b>Priya Patel<br>",
  attendees: [],
};

/**
 * @swagger
 * /api/calendarTest/create:
 *   post:
 *     summary: Create a test Google Calendar event
 *     tags: [Calendar Test]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *               summary:
 *                 type: string
 *               calendarId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test event created
 */
router.post(
  "/create",
  checkAuth,
  oAuth2,
  asyncHandler(async (req, res) => {
    const dateTime =
      req.body.dateTime || moment().add(1, "days").hour(10).minute(0).format();

    const event = {
      summary: req.body.summary || MOCK.summary,
      location: req.body.location || MOCK.location,
      description: req.body.description || MOCK.description,
      attendees: MOCK.attendees,
      AppointmentTime: dateTime,
      calendarId: req.body.calendarId || "primary",
    };

    const created = await calendarService.createEvent(
      req.oAuth2Client,
      event
    );

    res.status(200).json({
      success: true,
      message: "Calendar event created successfully.",
      event: {
        eventId: created.eventId,
        eventURL: created.eventURL,
        summary: event.summary,
        start: event.start,
        end: event.end,
      },
    });
  })
);

/**
 * @swagger
 * /api/calendarTest/update:
 *   patch:
 *     summary: Update a test Google Calendar event
 *     tags: [Calendar Test]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *               calendarId:
 *                 type: string
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *               summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test event updated
 *       400:
 *         description: eventId is required
 */
router.patch(
  "/update",
  checkAuth,
  oAuth2,
  asyncHandler(async (req, res) => {
    if (!req.body.eventId) {
      return res
        .status(400)
        .json({ error: "eventId is required to update an event." });
    }

    const dateTime =
      req.body.dateTime || moment().add(2, "days").hour(14).minute(30).format();

    const event = {
      eventId: req.body.eventId,
      calendarId: req.body.calendarId || "primary",
      summary: req.body.summary || MOCK.summary + " (Updated)",
      location: req.body.location || MOCK.location,
      description: req.body.description || MOCK.description,
      attendees: MOCK.attendees,
      AppointmentTime: dateTime,
    };

    const updated = await calendarService.updateEvent(
      req.oAuth2Client,
      event
    );

    res.status(200).json({
      success: true,
      message: "Calendar event updated successfully.",
      event: {
        eventId: updated.eventId,
        eventURL: updated.eventURL,
        summary: event.summary,
        start: event.start,
        end: event.end,
      },
    });
  })
);

/**
 * @swagger
 * /api/calendarTest/delete:
 *   delete:
 *     summary: Delete a test Google Calendar event
 *     tags: [Calendar Test]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: calendarId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test event deleted
 *       400:
 *         description: eventId is required
 */
router.delete(
  "/delete",
  checkAuth,
  oAuth2,
  asyncHandler(async (req, res) => {
    if (!req.query.eventId) {
      return res
        .status(400)
        .json({ error: "eventId is required to delete an event." });
    }

    await calendarService.deleteEvent(
      req.oAuth2Client,
      req.query.calendarId || "primary",
      req.query.eventId
    );

    res.status(200).json({
      success: true,
      message: "Calendar event deleted successfully.",
    });
  })
);

module.exports = router;
