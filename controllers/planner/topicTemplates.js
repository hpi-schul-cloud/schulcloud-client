const handleGetTopicTemplatesNew = (req, res, next) => {
  res.render("planner/newTemplate", {
    title: "Themenvorlage erstellen",
    id: "id1",
    initialValues: JSON.stringify({})
  });
};

const handlePostTopicTemplates = (req, res, next) => {
  // API Request + Redirect to myClasses
};

const handleGetTopicTemplate = (req, res, next) => {
  res.render("planner/editTemplate", {
    title: "Themenvorlage bearbeiten",
    id: "id1",
    initialValues: JSON.stringify({})
  });
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
