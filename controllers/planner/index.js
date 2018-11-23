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
  "/topicTemplates/:templateId",
  topicTemplatesRequestHandler.getTopicTemplate
);
router.put(
  "/topicTemplates/:templateId",
  topicTemplatesRequestHandler.putTopicTemplate
);
router.delete(
  "/topicTemplates/:templateId",
  topicTemplatesRequestHandler.deleteTopicTemplate
);

// Topic Instances
router.get(
  "/topicInstances/:instanceId",
  topicInstancesRequestHandler.getTopicInstance
);
router.put(
  "/topicInstances/:instanceId",
  topicInstancesRequestHandler.putTopicInstance
);
router.delete(
  "/topicInstances/:instanceId",
  topicInstancesRequestHandler.deleteTopicInstance
);

module.exports = router;
