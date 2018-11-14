const api = require("../../api");

const getSubjectTypeOptions = async req => {
  const subjectTypes = await api(req).get("/subjectTypes");
  return subjectTypes.data
    .map(entry => ({
      id: entry._id,
      text: entry.label
    }))
    .sort((a, b) => {
      a = a.text.toLowerCase();
      b = b.text.toLowerCase();

      return a < b ? -1 : b < a ? 1 : 0;
    });
};
const getClassLevelOptions = async req => {
  const gradeLevels = await api(req).get("/gradeLevels");
  return gradeLevels.data
    .map(entry => ({
      id: entry._id,
      text: entry.name
    }))
    .sort((a, b) => +a.text - +b.text);
};
const getValueOptions = async req => {
  return {
    subject: await getSubjectTypeOptions(req),
    classLevel: await getClassLevelOptions(req)
  };
};

const handleGetTopicTemplatesNew = async (req, res, next) => {
  const valueOptions = await getValueOptions(req);

  res.render("planner/newTemplate", {
    title: "Themenvorlage erstellen",
    valueOptions: JSON.stringify(valueOptions),
    initialValues: JSON.stringify({})
  });
};

const handlePostTopicTemplates = (req, res, next) => {
  // API Request + Redirect to myClasses
};

const handleGetTopicTemplate = async (req, res, next) => {
  const valueOptions = await getValueOptions(req);

  res.render("planner/editTemplate", {
    title: "Themenvorlage bearbeiten",
    id: "id1",
    valueOptions: JSON.stringify(valueOptions),
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
