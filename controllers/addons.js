const express = require("express");
const router = express.Router();

const authHelper = require("../helpers/authentication");
const permissionsHelper = require("../helpers/permissions");
const api = require("../api");

router.use(authHelper.authChecker);

router.get("/", function(req, res, next) {
  res.render("addons/addons", {
    title: "Add-ons"
  });
});

module.exports = router;
