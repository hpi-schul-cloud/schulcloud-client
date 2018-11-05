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
  chemistry: {
    subjectId: "chemistry",
    subjectName: "Chemie",
    classLevels: {
      "8": {
        classLevelId: "8",
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
const DUMMY_TOPIC_TEMPLATES = {
  biology: {
    "8": [
      { id: "4", text: "Evolution", width: 5, color: "#92DB92" },
      { id: "5", text: "Replikation", width: 10, color: "#92DB92" },
      { id: "6", text: "Zellteilung", width: 8, color: "#92DB92" }
    ],
    "10": [
      { id: "4", text: "Evolution", width: 5, color: "#92DB92" },
      { id: "5", text: "Replikation", width: 10, color: "#92DB92" },
      { id: "6", text: "Zellteilung", width: 8, color: "#92DB92" }
    ],
    "11": [
      { id: "4", text: "Evolution", width: 5, color: "#92DB92" },
      { id: "5", text: "Replikation", width: 10, color: "#92DB92" },
      { id: "6", text: "Zellteilung", width: 8, color: "#92DB92" }
    ]
  },
  chemistry: {
    "8": [
      { id: "4", text: "Evolution", width: 5, color: "#92DB92" },
      { id: "5", text: "Replikation", width: 10, color: "#92DB92" },
      { id: "6", text: "Zellteilung", width: 8, color: "#92DB92" }
    ],
    "9": [
      { id: "4", text: "Evolution", width: 5, color: "#92DB92" },
      { id: "5", text: "Replikation", width: 10, color: "#92DB92" },
      { id: "6", text: "Zellteilung", width: 8, color: "#92DB92" }
    ]
  }
};

const DUMMY_HOLIDAY_DATA = [
  {
    name: "Herbstferien",
    color: "#FBFFCF",
    utcStartDate: 1540166400000,
    utcEndDate: 1541116800000
  },
  {
    name: "Weihnachtsferien",
    color: "#FBFFCF",
    utcStartDate: 1545436800000,
    utcEndDate: 1546646400000
  }
];

const DUMMY_OTHER_DATA = [
  {
    name: "Projektwoche",
    color: "#e9e8e8",
    utcStartDate: 1548633600000,
    utcEndDate: 1548979200000
  }
];

const handleGetMyClasses = (req, res, next) => {
  res.render("planner/myClasses", {
    title: "Meine Klassen",
    schoolYear: JSON.stringify({
      utcStartDate: 1534723200000,
      utcEndDate: 1560902400000
    }),
    eventData: JSON.stringify([...DUMMY_HOLIDAY_DATA, ...DUMMY_OTHER_DATA]),
    allClassTopics: JSON.stringify(DUMMY_CLASS_TOPICS),
    allTopicTemplates: JSON.stringify(DUMMY_TOPIC_TEMPLATES)
  });
};

const handlePostMyClasses = (req, res, next) => {};

module.exports = {
  getMyClasses: handleGetMyClasses,
  postMyClasses: handlePostMyClasses
};
