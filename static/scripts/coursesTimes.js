let courseTimesCount = $('.course-time').length;

let guidGenerator = function guidGenerator() {
    let S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

let populateCourseTimes = function populateCourseTimes(modal, courseTimes) {
    var $courseTimes = modal.find('.add-course-times');
    // cleanup
    $courseTimes.find("tr:gt(0)").remove();

    // add new field
    courseTimes.forEach(function (time) {
        populateCourseTime($courseTimes, time);
    });
};

let deleteCourseTime = function (courseTimeId) {
    $('#' + courseTimeId).remove();
};

let addNewCourseTime = function addNewCourseTime(div) {
    let $courseTimesTable = div.find('.add-course-times');
    let $newCourseTime = div.find('.new-course-time-template').clone();
    let _id = guidGenerator();

    $newCourseTime.find('.new-course-time-template-weekday').attr('name', `times[${courseTimesCount}][weekday]`);
    $newCourseTime.find('.new-course-time-template-weekday').chosen();

    $newCourseTime.find('.new-course-time-template-startTime').attr('name', `times[${courseTimesCount}][startTime]`);
    $newCourseTime.find('.new-course-time-template-startTime').datetimepicker({
        datepicker:false,
        format:'H:i'
    });

    $newCourseTime.find('.new-course-time-template-duration').attr('name', `times[${courseTimesCount}][duration]`);
    $newCourseTime.find('.new-course-time-template-room').attr('name', `times[${courseTimesCount}][room]`);
    $newCourseTime.find('.course-time-delete').click(deleteCourseTime.bind(this, _id));

    $newCourseTime.attr('id', _id);
    $newCourseTime.removeClass('new-course-time-template');
    $newCourseTime.addClass('course-time');
    courseTimesCount++;

    $courseTimesTable.append($newCourseTime);
};

function populateCourseTime($courseTimes, field) {
    if (!field.duration || field.duration == '') return;

    var _id = guidGenerator();
    var $field = $("<tr id='" + _id + "' class='course-time'></tr>")
        .append($("<td><i class='fa fa-trash-o course-time-delete' /></td>")
            .click(deleteCourseTime.bind(this, _id))
        )
        .append($("<td class='form-group disabled'><input class='form-control' name='times[" + courseTimesCount + "][weekday]' value='" + field.weekday + "' type='text' ></input></td>"))
        .append($("<td class='form-group disabled'><input class='form-control' name='times[" + courseTimesCount + "][startTime]' value='" + field.startTime + "' type='time'></input></td>"))
        .append($("<td class='form-group disabled'><input class='form-control' name='times[" + courseTimesCount + "][duration]' value='" + field.duration + "' type='number'></input></td>"))
        .append($("<td class='form-group disabled'><input class='form-control' name='times[" + courseTimesCount + "][room]' value='" + field.room + "' type='text'></input></td>"));
    $courseTimes.append($field);
    courseTimesCount++;
};

$('.new-course-time-add').click(function (e) {
    // fallback if multiple time-containers are on one page, e.g. in administration
    var $timesContainer = $($(this).attr('data-timesref'));
    addNewCourseTime($timesContainer);
});

$('.course-time-delete').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    deleteCourseTime($(this).attr('href'));
});

// convert date/time values to german format after fetching from server
$.datetimepicker.setLocale('de');
$('input[data-time]').datetimepicker({
    datepicker: false,
    format: 'H:i',
    mask: '29:59'
});

$('input[data-date]').datetimepicker({
    timepicker: false,
    format: 'd.m.Y',
    mask: '39.19.9999'
});
