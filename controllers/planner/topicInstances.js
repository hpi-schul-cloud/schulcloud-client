const api = require("../../api");
const logger = require("winston");

const getInitialValues = topicInstanceData => {
  return {
    subject: topicInstanceData.courseId.subjectId.label,
    classLevel: topicInstanceData.courseId.classIds[0].gradeLevel
      ? `${topicInstanceData.courseId.classIds[0].gradeLevel.name}${
          topicInstanceData.courseId.classIds[0].name
        }`
      : topicInstanceData.courseId.classIds[0].name,
    name: topicInstanceData.name,
    parentTemplate: {
      id: topicInstanceData.parentTemplateId._id,
      name: topicInstanceData.parentTemplateId.name
    },
    numberOfWeeks: topicInstanceData.numberOfWeeks,
    unitsPerWeek: topicInstanceData.unitsPerWeek,
    content: topicInstanceData.content,
    subjectUnits: topicInstanceData.lectureUnits,
    examinations: topicInstanceData.examinations,
    material: topicInstanceData.material
  };
};

const handleGetTopicInstance = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const topicInstanceData = await api(req).get(
      `/topicInstances/${instanceId}`,
      {
        qs: {
          $populate: [
            {
              path: "courseId",
              populate: [
                {
                  path: "classIds",
                  populate: ["gradeLevel"]
                },
                "subjectId"
              ]
            },
            "parentTemplateId"
          ]
        }
      }
    );
    const initialValues = getInitialValues(topicInstanceData);

    res.render("planner/editInstace", {
      title: "Thema bearbeiten",
      id: instanceId,
      initialValues: JSON.stringify(initialValues)
    });
  } catch (e) {
    console.log(e);
    logger.warn(e);
    next(e);
  }
};

const handlePutTopicInstance = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const {
      name,
      numberOfWeeks,
      unitsPerWeek,
      content,
      subjectUnits,
      examinations,
      material
    } = req.body;
    await api(req).patch(`/topicInstances/${instanceId}`, {
      json: {
        name,
        numberOfWeeks,
        unitsPerWeek,
        content,
        lectureUnits: subjectUnits,
        examinations,
        material
      }
    });
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    logger.warn(e);
    res.status(e.statusCode || 500).send(e);
  }
};

const handleDeleteTopicInstance = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    await api(req).delete(`/topicInstances/${instanceId}`);
    res.sendStatus(200);
  } catch (e) {
    logger.warn(e);
    res.status(e.statusCode || 500).send(e);
  }
};

module.exports = {
  getTopicInstance: handleGetTopicInstance,
  putTopicInstance: handlePutTopicInstance,
  deleteTopicInstance: handleDeleteTopicInstance
};
