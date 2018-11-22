const logger = require("winston");
const api = require("../../api");
const {
  getFederalState,
  getHolidays,
  checkForSommerHoliday
} = require("./helper");

// topics: [
//   {
//     id: "1",
//     text: "1.Topic",
//     color: "#92DB92",
//     startIndex: 0,
//     endIndex: 3
//   },
//   {
//     id: "2",
//     text: "2.Topic",
//     color: "#92DB92",
//     startIndex: 4,
//     endIndex: 6
//   },
//   {
//     id: "3",
//     text: "3.Topic",
//     color: "#92DB92",
//     startIndex: 8,
//     endIndex: 12
//   }
// ]

const DUMMY_OTHER_DATA = [
  {
    name: "Projektwoche",
    color: "#e9e8e8",
    utcStartDate: 1548633600000,
    utcEndDate: 1548979200000
  }
];

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
    const currentYear = +year.name.split("/")[0]; // name is in the format "2017/18" -> extract 2017
    const currentSchoolYearDates = getCurrentYearDates(currentYear);
    if (currentSchoolYearDates)
      schoolYearMap[year._id] = currentSchoolYearDates;

    return schoolYearMap;
  }, {});
};

const transformToAPIShape = coursesWithTopics => {
  return coursesWithTopics.reduce((topicsMap, course) => {
    if (!topicsMap[course.schoolYearId])
      topicsMap[course.schoolYearId] = {
        schoolYearId: course.schoolYearId,
        schoolYearName: course.schoolYearName,
        subjects: {}
      };
    if (!topicsMap[course.schoolYearId].subjects[course.subjectId])
      topicsMap[course.schoolYearId].subjects[course.subjectId] = {
        subjectId: course.subjectId,
        subjectName: course.subjectName,
        classLevels: {}
      };
    if (
      !topicsMap[course.schoolYearId].subjects[course.subjectId].classLevels[
        course.classLevelId
      ]
    )
      topicsMap[course.schoolYearId].subjects[course.subjectId].classLevels[
        course.classLevelId
      ] = {
        classLevelId: course.classLevelId,
        classLevelName: `Jahrgang ${course.classLevelName}`,
        classes: {}
      };
    if (
      !topicsMap[course.schoolYearId].subjects[course.subjectId].classLevels[
        course.classLevelId
      ].classes[course.id]
    ) {
      topicsMap[course.schoolYearId].subjects[course.subjectId].classLevels[
        course.classLevelId
      ].classes[course.id] = {
        id: course.id,
        name: course.name,
        topics: course.topics
      };
    }
    return topicsMap;
  }, {});
};
const populateClassesWithTopics = async flattenedCourses => {
  const coursePromises = flattenedCourses.map(course => {
    // API CALL for topic instance mit course.id
    return new Promise(res => res([]));
  });
  const topicInstanceData = await Promise.all(coursePromises);
  return flattenedCourses.map((course, index) => ({
    ...course,
    // topicInstanceData has to be transformed here -> startIndex/endIndex
    topics: topicInstanceData[index]
  }));
};
const filterAndFlattenCourseData = courses => {
  return courses.data.reduce((relevantCourseData, course) => {
    // A course must have at least one assigned class
    if (course.classIds.length < 1) return relevantCourseData;
    // Currently we simply use the first defined class
    const courseClass = course.classIds[0];
    // If a class has no year assigned, we ignore it
    if (!courseClass.year) return relevantCourseData;
    const courseData = {
      id: course._id,
      name: course.name,
      ...(course.subjectId
        ? {
            subjectId: course.subjectId._id,
            subjectName: course.subjectId.label
          }
        : {
            subjectId: "",
            subjectName: "Nicht zugeordnet"
          })
    };
    const courseClassData = {
      schoolYearId: courseClass.year._id,
      schoolYearName: courseClass.year.name,
      ...(courseClass.gradeLevel
        ? {
            classLevelId: courseClass.gradeLevel._id,
            classLevelName: courseClass.gradeLevel.name
          }
        : { classLevelId: "", classLevelName: "Nicht zugeordnet" })
    };
    relevantCourseData.push({
      ...courseData,
      ...courseClassData
    });
    return relevantCourseData;
  }, []);
};
const getAllClassTopics = async req => {
  const courses = await api(req).get("/courses", {
    qs: {
      $populate: [
        { path: "classIds", populate: ["year", "gradeLevel"] },
        "subjectId"
      ]
    }
  });
  const transformedCourseData = filterAndFlattenCourseData(courses);
  const coursesWithTopics = await populateClassesWithTopics(
    transformedCourseData
  );
  // Transform data into api required shape
  return transformToAPIShape(coursesWithTopics);
};
// Get the current school year id based on the school year data
// Todo: implementation is brittle, because we rely on schoolYearData being sorted
const getInitialSchoolYearId = schoolYearData => {
  const today = new Date().getTime();
  let lastEndDate = null;
  let lastId = null;
  for (let key in schoolYearData) {
    if (
      today > schoolYearData[key].utcStartDate &&
      today < schoolYearData[key].utcEndDate
    )
      return key;
    else if (today < schoolYearData[key].utcStartDate) {
      if (!lastEndDate) return null;
      const middleOfSchoolYears =
        (schoolYearData[key].utcStartDate - lastEndDate) / 2 + lastEndDate;
      if (today > middleOfSchoolYears) return key;
      else return lastId;
    }
    lastEndDate = schoolYearData[key].utcEndDate;
    lastId = key;
  }
  return null;
};

const handleGetMyClasses = async (req, res, next) => {
  try {
    const schoolId = res.locals.currentUser.schoolId;
    const stateCode = await getFederalState(req, schoolId);
    const holidays = await getHolidays(req, { stateCode });
    const allTopicTemplates = await getAllTopicTemplates(req);
    const schoolYearData = await getSchoolYearData(req, holidays);
    const initialSchoolYearId = getInitialSchoolYearId(schoolYearData);
    const allClassTopics = await getAllClassTopics(req);

    res.render("planner/myClasses", {
      title: "Meine Klassen",
      initialSchoolYearId: initialSchoolYearId,
      schoolYearData: JSON.stringify(schoolYearData),
      eventData: JSON.stringify([...holidays, ...DUMMY_OTHER_DATA]),
      allClassTopics: JSON.stringify(allClassTopics),
      allTopicTemplates: JSON.stringify(allTopicTemplates)
    });
  } catch (e) {
    console.log(e);
    logger.warn(e);
    next(e);
  }
};

const handlePostMyClasses = (req, res, next) => {};

module.exports = {
  getMyClasses: handleGetMyClasses,
  postMyClasses: handlePostMyClasses
};
