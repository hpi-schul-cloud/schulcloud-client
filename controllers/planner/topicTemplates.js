const handleGetTopicTemplatesNew = (req, res, next) => {
  res.render("planner/newTemplate", { title: "Übersicht" });
};

const handlePostTopicTemplates = (req, res, next) => {
  // API Request + Redirect to myClasses
};

const handleGetTopicTemplate = (req, res, next) => {
  res.render("planner/editTemplate", { title: "Übersicht" });
};

const handlePutTopicTemplate = (req, res, next) => {
  // API Request + Redirect to myClasses
};

const handleDeleteTopicTemplate = (req, res, next) => {
  // API Request + Redirect to myClasses
};

module.exports = {
  getTopicTemplatesNew: handleGetTopicTemplatesNew,
  postTopicTemplates: handlePostTopicTemplates,
  getTopicTemplate: handleGetTopicTemplate,
  putTopicTemplate: handlePutTopicTemplate,
  deleteTopicTemplate: handleDeleteTopicTemplate
};
