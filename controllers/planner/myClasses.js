const logger = require("winston");
const api = require("../../api");
const { getFederalState, getHolidays } = require("./helper");

const getSubjects = () => ({
  biology: {
    subjectId: "biology",
    subjectName: "Biologie",
    classLevels: {
      "8": {
        classLevelId: "8",
        classLevelName: "Jahrgang 8",
        classes: getClassInstances(8)
      },
      "10": {
        classLevelId: "10",
        classLevelName: "Jahrgang 10",
        classes: getClassInstances(10)
      },
      "11": {
        classLevelId: "11",
        classLevelName: "Jahrgang 11",
        classes: getClassInstances(11)
      }
    }
  },
  "5beb4c59f745b16c3630dd2b": {
    subjectId: "5beb4c59f745b16c3630dd2b",
    subjectName: "Chemie",
    classLevels: {
      "5beb4c57f745b16c3630dcdd": {
        classLevelId: "5beb4c57f745b16c3630dcdd",
        classLevelName: "Jahrgang 8",
        classes: getClassInstances(8)
      },
      "9": {
        classLevelId: "9",
        classLevelName: "Jahrgang 9",
        classes: getClassInstances(9)
      }
    }
  }
});

const getAllClassInstances = () => ({
  "17/18": {
    schoolYearId: "17/18",
    schoolYearName: "2017/2018",
    subjects: getSubjects()
  },
  "18/19": {
    schoolYearId: "18/19",
    schoolYearName: "2018/2019",
    subjects: getSubjects()
  }
});

const getClassInstances = classLevel => ({
  [`${classLevel}a`]: {
    id: `${classLevel}a`,
    name: `Klasse ${classLevel}a`,
    topics: [
      {
        id: "1",
        text: "1.Topic",
        color: "#92DB92",
        startIndex: 0,
        endIndex: 3
      },
      {
        id: "2",
        text: "2.Topic",
        color: "#92DB92",
        startIndex: 4,
        endIndex: 6
      },
      {
        id: "3",
        text: "3.Topic",
        color: "#92DB92",
        startIndex: 8,
        endIndex: 12
      }
    ]
  },
  [`${classLevel}b`]: {
    id: `${classLevel}b`,
    name: `Klasse ${classLevel}b`,
    topics: [
      {
        id: "1",
        text: "1.Topic",
        color: "#92DB92",
        startIndex: 0,
        endIndex: 3
      },
      {
        id: "2",
        text: "2.Topic",
        color: "#92DB92",
        startIndex: 4,
        endIndex: 6
      },
      {
        id: "3",
        text: "3.Topic",
        color: "#92DB92",
        startIndex: 8,
        endIndex: 12
      }
    ]
  },
  [`${classLevel}c`]: {
    id: `${classLevel}c`,
    name: `Klasse ${classLevel}c`,
    topics: [
      {
        id: "1",
        text: "1.Topic",
        color: "#92DB92",
        startIndex: 0,
        endIndex: 3
      },
      {
        id: "2",
        text: "2.Topic",
        color: "#92DB92",
        startIndex: 4,
        endIndex: 6
      },
      {
        id: "3",
        text: "3.Topic",
        color: "#92DB92",
        startIndex: 8,
        endIndex: 12
      }
    ]
  }
});

const DUMMY_CLASS_TOPICS = getAllClassInstances();

const DUMMY_OTHER_DATA = [
  {
    name: "Projektwoche",
    color: "#e9e8e8",
    utcStartDate: 1548633600000,
    utcEndDate: 1548979200000
  }
];

const DUMMY_SCHOOL_YEAR_DATA = {
  "17/18": {
    utcStartDate: 1504500000000,
    utcEndDate: 1530679200000
  },
  "18/19": {
    utcStartDate: 1534723200000,
    utcEndDate: 1560902400000
  }
};
const getAllTopicTemplates = async req => {
  const templatesData = await api(req).get("/topicTemplates");
  return templatesData.data.reduce((templatesMap, template) => {
    const { subjectId, gradeLevelId, _id, name, numberOfWeeks } = template;
    const defaultGradeLevelId = gradeLevelId || "not_defined";
    const newTemplate = {
      id: _id,
      text: name,
      width: +numberOfWeeks,
      color: "#92DB92"
    };
    if (!templatesMap[subjectId]) templatesMap[subjectId] = {};
    if (!templatesMap[subjectId][defaultGradeLevelId])
      templatesMap[subjectId][defaultGradeLevelId] = [newTemplate];
    else
      templatesMap[subjectId][defaultGradeLevelId] = [
        ...templatesMap[subjectId][defaultGradeLevelId],
        newTemplate
      ];

    return templatesMap;
  }, {});
};

const handleGetMyClasses = async (req, res, next) => {
  try {
    const schoolId = res.locals.currentUser.schoolId;
    const stateCode = await getFederalState(req, schoolId);
    const holidays = await getHolidays(req, { stateCode });
    const allTopicTemplates = await getAllTopicTemplates(req);
    console.log(allTopicTemplates);
    res.render("planner/myClasses", {
      title: "Meine Klassen",
      schoolYearData: JSON.stringify(DUMMY_SCHOOL_YEAR_DATA),
      eventData: JSON.stringify([...holidays, ...DUMMY_OTHER_DATA]),
      allClassTopics: JSON.stringify(DUMMY_CLASS_TOPICS),
      allTopicTemplates: JSON.stringify(allTopicTemplates)
    });
  } catch (e) {
    logger.warn(e);
    next(e);
  }
};

const handlePostMyClasses = (req, res, next) => {};

module.exports = {
  getMyClasses: handleGetMyClasses,
  postMyClasses: handlePostMyClasses
};
