const handleGetMyClasses = (req, res, next) => {
  res.render("planner/myClasses", { title: "Konfiguration" });
};

const handlePostMyClasses = (req, res, next) => {};

module.exports = {
  getMyClasses: handleGetMyClasses,
  postMyClasses: handlePostMyClasses
};
