const express = require("express");
const router = express.Router({ mergeParams: true });
const authHelper = require("../../helpers/authentication");
const calendarRequestHandler = require("./calendar");
const myClassesRequestHandler = require("./myClasses");
const topicTemplatesRequestHandler = require("./topicTemplates");
const topicInstancesRequestHandler = require("./topicInstances");

router.use(authHelper.authChecker);

// Calendar
router.get("/", (req, res, next) => {
  res.redirect("/planner/calendar");
});
router.get("/calendar", calendarRequestHandler.getCalendar);

// My Classes
router.get("/myClasses", myClassesRequestHandler.getMyClasses);
router.post("/myClasses", myClassesRequestHandler.postMyClasses);

// Topic Templates
router.get(
  "/topicTemplates/new",
  topicTemplatesRequestHandler.getTopicTemplatesNew
);
router.post("/topicTemplates", topicTemplatesRequestHandler.postTopicTemplates);
router.get(
  "/topicTemplates/:id",
  topicTemplatesRequestHandler.getTopicTemplate
);
router.put(
  "/topicTemplates/:id",
  topicTemplatesRequestHandler.putTopicTemplate
);
router.delete(
  "/topicTemplates/:id",
  topicTemplatesRequestHandler.deleteTopicTemplate
);

// Topic Instances
router.get(
  "/topicInstances/:id",
  topicInstancesRequestHandler.getTopicInstance
);
router.put(
  "/topicInstances/:id",
  topicInstancesRequestHandler.putTopicInstance
);
router.delete(
  "/topicInstances/:id",
  topicInstancesRequestHandler.deleteTopicInstance
);

module.exports = router;
