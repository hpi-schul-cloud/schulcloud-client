const logger = require("winston");
const api = require("../../api");
const {
  getFederalState,
  getHolidays,
  checkForSommerHoliday
} = require("./helper");

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
  "5b7de0021a3a07c20a1c165d": {
    schoolYearId: "5b7de0021a3a07c20a1c165d",
    schoolYearName: "2017/2018",
    subjects: getSubjects()
  },
  "5b7de0021a3a07c20a1c165e": {
    schoolYearId: "5b7de0021a3a07c20a1c165e",
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

const DAY = 1000 * 60 * 60 * 24;
const getSchoolYearDatesFromSummerHolidays = (
  firstSummerHolidays,
  secondSummerHolidays
) => {
  const schoolYearStartDay = new Date(
    firstSummerHolidays.utcEndDate
  ).getUTCDay();
  // We cannot be sure what the definiton of the utc end date of the summer holidays actually is
  // -> We add time until we reach the next Monday ( Sunday = 0, Saturday = 6, ...)
  const factor = Math.abs((schoolYearStartDay - 7 - 1) % 7);

  return {
    utcStartDate: firstSummerHolidays.utcEndDate + factor * DAY,
    utcEndDate: secondSummerHolidays.utcStartDate - DAY
  };
};
const getSchoolYearData = async (req, holidays) => {
  const years = await api(req).get("/years");
  const getCurrentYearDates = currentYear => {
    const relevantData = holidays
      .filter(checkForSommerHoliday)
      .filter(
        holiday =>
          holiday.year === currentYear || holiday.year === currentYear + 1
      )
      .sort((a, b) => a.year - b.year);
    // Array should have two items: summer holidays from current year and next year
    if (relevantData.length !== 2) return null;
    return getSchoolYearDatesFromSummerHolidays(
      relevantData[0],
      relevantData[1]
    );
  };

  return years.data.reduce((schoolYearMap, year) => {
    const currentYear = +year.name.split("/")[0]; // name is in the format "2017/18"
    const currentSchoolYearDates = getCurrentYearDates(currentYear);
    if (currentSchoolYearDates)
      schoolYearMap[year._id] = currentSchoolYearDates;

    return schoolYearMap;
  }, {});
};

const handleGetMyClasses = async (req, res, next) => {
  try {
    const schoolId = res.locals.currentUser.schoolId;
    const stateCode = await getFederalState(req, schoolId);
    const holidays = await getHolidays(req, { stateCode });
    const allTopicTemplates = await getAllTopicTemplates(req);
    const schoolYearData = await getSchoolYearData(req, holidays);

    res.render("planner/myClasses", {
      title: "Meine Klassen",
      schoolYearData: JSON.stringify(schoolYearData),
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
