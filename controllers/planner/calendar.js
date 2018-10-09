const handleGetCalendar = (req, res, next) => {
    res.render("planner/calendar", {title: 'Übersicht'});
};

module.exports = {
    getCalendar: handleGetCalendar
};
