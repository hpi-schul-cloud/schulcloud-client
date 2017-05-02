$(document).ready(function () {

    var courseTimesCount = 0;

    function guidGenerator() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    var deleteCourseTime = function (courseTimeId) {
        $('#' + courseTimeId).remove();
    };

    var addNewCourseTime = function () {
        var $courseTimes = $('.add-course-times');
        var $newWeekday = $('.new-weekday option:selected');
        var $newStartTime = $('.new-start-time');
        var $newDuration = $('.new-duration');
        populateCourseTime($courseTimes, {
            weekday: $newWeekday.text(),
            startTime: $newStartTime.val(),
            duration: $newDuration.val()
        });
        $newWeekday.val("");
        $newStartTime.val("");
        $newDuration.val("");
    };

    var populateCourseTime = function ($courseTimes, field) {
        if (!field.duration || field.duration == '') return;

        var _id = guidGenerator();
        var $field = $("<tr id='" + _id + "'></tr>")
            .append($("<td><i class='fa fa-trash-o custom-field-delete' /></td>")
                .click(deleteCourseTime.bind(this, _id))
            )
            .append($("<td class='form-group'><input class='form-control' name='times[" + courseTimesCount + "][weekday]' value='" + field.weekday + "' type='text' ></input></td>"))
            .append($("<td class='form-group'><input class='form-control' name='times[" + courseTimesCount + "][startTime]' value='" + field.startTime + "' type='time'></input></td>"))
            .append($("<td class='form-group'><input class='form-control' name='times[" + courseTimesCount + "][duration]' value='" + field.duration + "' type='number'></input></td>"))
        $courseTimes.append($field);
        courseTimesCount++;
    };

    $('.new-custom-field-add').click(addNewCourseTime);

});