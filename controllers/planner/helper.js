const querystring = require("querystring");
const api = require("../../api");

const getUTCDate = date => {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0
  );
};
const transfromISODateToUTC = date => getUTCDate(new Date(Date.parse(date)));

const getFederalState = async (req, schoolId) => {
  const schoolData = await api(req).get("/schools/" + schoolId, {
    qs: {
      $populate: ["federalState"]
    }
  });
  return schoolData.federalState.abbreviation;
};

const capitalizeFirstLetter = string =>
  string.charAt(0).toUpperCase() + string.slice(1);
const getHolidays = async (req, { year, stateCode }) => {
  const queryParams = querystring.stringify({ year, stateCode });
  const url = `/holidays?${queryParams}`;
  const holidays = await api(req).get(url);

  return holidays.map(holiday => ({
    name: capitalizeFirstLetter(holiday.name),
    color: "#FBFFCF",
    utcStartDate: transfromISODateToUTC(holiday.start),
    utcEndDate: transfromISODateToUTC(holiday.end)
  }));
};

module.exports = {
  getUTCDate,
  transfromISODateToUTC,
  getFederalState,
  getHolidays
};
