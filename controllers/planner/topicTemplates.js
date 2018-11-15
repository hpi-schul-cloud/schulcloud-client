const api = require("../../api");
const logger = require("winston");

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
const getInitialValues = async req => {
  const { templateId } = req.params;
  const initialValues = await api(req).get(`/topicTemplates/${templateId}`);
  const {
    subjectId,
    gradeLevelId: classLevelId,
    name,
    numberOfWeeks,
    unitsPerWeek,
    content,
    lectureUnits: subjectUnits,
    examinations
  } = initialValues;
  return {
    subjectId,
    classLevelId,
    name,
    numberOfWeeks,
    unitsPerWeek,
    content,
    subjectUnits,
    examinations
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

const handlePostTopicTemplates = async (req, res, next) => {
  // API Request + Redirect to myClasses
  try {
    const { classLevelId, ...others } = req.body;
    await api(req).post("/topicTemplates", {
      json: {
        ...others,
        gradeLevelId: classLevelId,
        userId: res.locals.currentUser._id
      }
    });
    res.sendStatus(200);
  } catch (e) {
    logger.warn(e);
    res.status(e.statusCode || 500).send(e);
  }
};

const handleGetTopicTemplate = async (req, res, next) => {
  const { templateId: id } = req.params;
  const valueOptions = await getValueOptions(req);
  const initialValues = await getInitialValues(req);
  console.log(initialValues);
  res.render("planner/editTemplate", {
    title: "Themenvorlage bearbeiten",
    valueOptions: JSON.stringify(valueOptions),
    id,
    initialValues: JSON.stringify(initialValues)
  });
};

const handlePutTopicTemplate = (req, res, next) => {
  res.sendStatus(200);
  // API Request + Redirect to myClasses
};

const handleDeleteTopicTemplate = (req, res, next) => {
  res.sendStatus(200);
  // API Request + Redirect to myClasses
};

module.exports = {
  getTopicTemplatesNew: handleGetTopicTemplatesNew,
  postTopicTemplates: handlePostTopicTemplates,
  getTopicTemplate: handleGetTopicTemplate,
  putTopicTemplate: handlePutTopicTemplate,
  deleteTopicTemplate: handleDeleteTopicTemplate
};
