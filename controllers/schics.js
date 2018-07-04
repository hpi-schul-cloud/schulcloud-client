const express = require("express");
const router = express.Router({ mergeParams: true });

router.get("/", (req, res, next) => {
  res.render("schics/schic", {title: 'Schics'});
});

module.exports = router;
