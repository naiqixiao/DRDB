const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const validate = require("../middleware/validate");

const FamilyController = require("../controllers/family");

const familyCreateValidation = [
    body("Email")
        .optional({ values: "falsy" })
        .isEmail().withMessage("Email must be a valid email address")
        .isLength({ max: 40 }).withMessage("Email must not exceed 40 characters"),
    body("Phone")
        .optional({ values: "falsy" })
        .isLength({ max: 11 }).withMessage("Phone must not exceed 11 characters")
        .matches(/^\d+$/).withMessage("Phone must contain only digits"),
    body("CellPhone")
        .optional({ values: "falsy" })
        .isLength({ max: 11 }).withMessage("CellPhone must not exceed 11 characters")
        .matches(/^\d+$/).withMessage("CellPhone must contain only digits"),
    body("NamePrimary")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("NamePrimary must not exceed 50 characters"),
    body("NameSecondary")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("NameSecondary must not exceed 50 characters"),
    body("EnglishPercent")
        .optional({ values: "falsy" })
        .isInt({ min: 0, max: 100 }).withMessage("EnglishPercent must be an integer between 0 and 100"),
    body("Children")
        .optional()
        .isArray().withMessage("Children must be an array"),
    body("Children.*.Name")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("Child name must not exceed 50 characters"),
    body("Children.*.Sex")
        .optional({ values: "falsy" })
        .isLength({ max: 1 }).withMessage("Child Sex must be a single character"),
    body("Children.*.DoB")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("Child DoB must be a valid date (YYYY-MM-DD)"),
];

router.post("/add", checkAuth, familyCreateValidation, validate, FamilyController.create);

router.post("/addBatch", checkAuth, FamilyController.batchCreate0);

router.get("/", checkAuth, FamilyController.search);

router.get("/followup", checkAuth, FamilyController.followupSearch);

// router.post("/special", checkAuth, FamilyController.changeTrainingFamilyEmail);

router.post("/releaseFamily", checkAuth, FamilyController.releaseFamilyNew);

router.post("/assignLabtoFamilies", checkAuth, FamilyController.assignLabtoFamilies);

router.post("/", checkAuth, FamilyController.update);

router.delete("/", checkAuth, FamilyController.delete);

module.exports = router;