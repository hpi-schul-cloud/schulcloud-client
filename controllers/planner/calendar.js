const api = require("../../api");
const {
  getUTCDate,
  getFederalState,
  getHolidays,
  getFirstSommerHolidays
} = require("./helper");
const DUMMY_CLASS_DATA = [
  {
    className: "Klasse 8a",
    classes: [
      {
        subjectId: "biology",
        subjectName: "Biologie",
        topics: [
          {
            id: "Thema 1",
            text: "Thema 1",
            color: "#92DB92",
            utcStartDate: 1534723200000,
            utcEndDate: 1535932799999
          },
          {
            id: "Thema 2",
            text: "Thema 2",
            color: "#92DB92",
            utcStartDate: 1535932800000,
            utcEndDate: 1539561599999
          },
          {
            id: "Thema 3",
            text: "Thema 3",
            color: "#92DB92",
            utcStartDate: 1539561600000,
            utcEndDate: 1541980799999
          }
        ]
      }
    ]
  },
  {
    className: "Klasse 8b",
    classes: [
      {
        subjectId: "biology",
        subjectName: "Biologie",
        topics: [
          {
            id: "Thema 4",
            text: "Thema 4",
            color: "#92DB92",
            utcStartDate: 1534723200000,
            utcEndDate: 1536537599999
          },
          {
            id: "Thema 5",
            text: "Thema 5",
            color: "#92DB92",
            utcStartDate: 1536537600000,
            utcEndDate: 1538956799999
          },
          {
            id: "Thema 6",
            text: "Thema 6",
            color: "#92DB92",
            utcStartDate: 1538956800000,
            utcEndDate: 1542585599999
          }
        ]
      },
      {
        subjectId: "chemistry",
        subjectName: "Chemie",
        topics: [
          {
            id: "Thema 7",
            text: "Thema 7",
            color: "#DBC192",
            utcStartDate: 1534723200000,
            utcEndDate: 1535327999999
          },
          {
            id: "Thema 8",
            text: "Thema 8",
            color: "#DBC192",
            utcStartDate: 1535328000000,
            utcEndDate: 1537747199999
          },
          {
            id: "Thema 9",
            text: "Thema 9",
            color: "#DBC192",
            utcStartDate: 1537747200000,
            utcEndDate: 1540771199999
          }
        ]
      }
    ]
  },
  {
    className: "Klasse 10a",
    classes: [
      {
        subjectId: "chemistry",
        subjectName: "Chemie",
        topics: [
          {
            id: "Thema 10",
            text: "Thema 10",
            color: "#DBC192",
            utcStartDate: 1534723200000,
            utcEndDate: 1537142399999
          },
          {
            id: "Thema 11",
            text: "Thema 11",
            color: "#DBC192",
            utcStartDate: 1537142400000,
            utcEndDate: 1538351999999
          },
          {
            id: "Thema 12",
            text: "Thema 12",
            color: "#DBC192",
            utcStartDate: 1538352000000,
            utcEndDate: 1540771199999
          },
          {
            id: "Thema 13",
            text: "Thema 13",
            color: "#DBC192",
            utcStartDate: 1540771200000,
            utcEndDate: 1543795199999
          }
        ]
      }
    ]
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

const DAY = 1000 * 60 * 60 * 24;

const getCurrentSchoolYear = async (req, stateCode) => {
  const today = new Date();
  const currentYearHolidays = await getHolidays(req, {
    year: today.getFullYear(),
    stateCode
  });
  const currentYearSummerHolidays = getFirstSommerHolidays(currentYearHolidays);
  const middleOfSummerHolidays = Math.round(
    (Date.parse(currentYearSummerHolidays.start) +
      Date.parse(currentYearSummerHolidays.end)) /
      2
  );
  /* If current time is smaller than middle of summer holidays,
    -> schoolyear = determined by summer holidays from this year (e.g. 18) and last year (e.g. 17)
    Otherwise
    -> schoolyear = determined by summer holidays from this year (e.g. 18) and next year (e.g. 19)
  */
  if (today.getTime() < middleOfSummerHolidays) {
    const previousYear = today.getFullYear() - 1;
    const previousYearHolidays = await getHolidays(req, {
      year: previousYear,
      stateCode
    });
    const previousYearSummerHolidays = getFirstSommerHolidays(
      previousYearHolidays
    );
    return {
      // School year start date is end of summer holidays + one day
      utcStartDate: previousYearSummerHolidays.utcEndDate + DAY,
      // School year end date is start of summer holidays - one day
      utcEndDate: currentYearSummerHolidays.utcStartDate - DAY
    };
  } else {
    const nextYear = today.getFullYear() + 1;
    const nextYearHolidays = await getHolidays(req, {
      year: nextYear,
      stateCode
    });
    const nextYearSummerHolidays = getFirstSommerHolidays(nextYearHolidays);
    return {
      utcStartDate: currentYearSummerHolidays.utcEndDate + DAY,
      utcEndDate: nextYearSummerHolidays.utcStartDate - DAY
    };
  }
};

const getHolidaysData = async (req, { schoolYear, stateCode }) => {
  const firstYear = new Date(schoolYear.utcStartDate).getFullYear();
  const secondYear = new Date(schoolYear.utcEndDate).getFullYear();
  const firstYearHolidays = await getHolidays(req, {
    year: firstYear,
    stateCode
  });
  const secondYearHolidays = await getHolidays(req, {
    year: secondYear,
    stateCode
  });
  const holidays = [...firstYearHolidays, ...secondYearHolidays];

  return holidays.filter(
    holiday =>
      holiday.utcEndDate > schoolYear.utcStartDate &&
      holiday.utcStartDate < schoolYear.utcEndDate
  );
};

const handleGetCalendar = async (req, res, next) => {
  const utcToday = getUTCDate(new Date());
  const schoolId = res.locals.currentUser.schoolId;
  const stateCode = await getFederalState(req, schoolId);
  const schoolYear = await getCurrentSchoolYear(req, stateCode);
  const holidaysData = await getHolidaysData(req, { schoolYear, stateCode });

  res.render("planner/calendar", {
    title: "Kalender",
    schoolYear: JSON.stringify(schoolYear),
    utcToday,
    classTopicsData: JSON.stringify(DUMMY_CLASS_DATA),
    holidaysData: JSON.stringify(holidaysData),
    otherEventsData: JSON.stringify(DUMMY_OTHER_DATA)
  });
};

module.exports = {
  getCalendar: handleGetCalendar
};
