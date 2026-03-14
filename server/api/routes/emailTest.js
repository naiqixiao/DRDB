const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const asyncHandler = require("express-async-handler");
const { sendAdminEmail } = require("../utils/emailUtil");

/**
 * POST /api/emailTest/send
 * Send a test email via the admin Gmail account.
 * Body: { to, cc?, bcc?, subject, htmlBody }
 */
router.post(
  "/send",
  checkAuth,
  asyncHandler(async (req, res) => {
    const { to, cc, bcc, subject, htmlBody } = req.body;

    if (!to || !subject || !htmlBody) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, htmlBody",
      });
    }

    const result = await sendAdminEmail({ to, cc, bcc, subject, htmlBody });

    res.status(200).json({
      message: "Test email sent successfully!",
      messageId: result.data?.id,
    });
  })
);

module.exports = router;
