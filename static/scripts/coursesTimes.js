import 'jquery-datetimepicker';

let courseTimesCount = $('.course-time').length;

let guidGenerator = function guidGenerator() {
    let S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

export const populateCourseTimes = function populateCourseTimes(modal, courseTimes) {
    let $courseTimes = modal.find('.course-times');
    // cleanup
    $courseTimes.find("tr:gt(0)").not('.new-course-time-template').remove();

    // add new field
    courseTimes.forEach(function (time) {
        let $courseTime = addNewCourseTime($courseTimes);
        populateCourseTime($courseTime, time);
    });
};

let deleteCourseTime = function (courseTimeId) {
    $('#' + courseTimeId).remove();
};

/** fix the bootstrap-chosen solution **/
let fixChosen = function (selectElement) {
	selectElement.chosen({ width: "100%", height: "100%" });
	selectElement.parent().find('.chosen-container-single-nosearch').remove();
};

/** creates a new empty course-time row **/
let addNewCourseTime = function addNewCourseTime(div) {
    let $courseTimesTable = div.find('.add-course-times');
    let $newCourseTime = div.find('.new-course-time-template').clone();
    let _id = guidGenerator();

    let logic = function( currentDateTime ){
        // 'this' is jquery object datetimepicker
        this.setOptions({
            minTime:'06:00',
            maxTime:'23:00'
        });
      };

    $newCourseTime.find('.new-course-time-template-weekday').attr('name', `times[${courseTimesCount}][weekday]`);
	fixChosen($newCourseTime.find('.new-course-time-template-weekday'));
	$newCourseTime.find('.new-course-time-template-weekday');
    $newCourseTime.find('.new-course-time-template-startTime').attr('name', `times[${courseTimesCount}][startTime]`);
    $newCourseTime.find('.new-course-time-template-startTime').attr('autocomplete', 'off');
    $newCourseTime.find('.new-course-time-template-startTime').datetimepicker({
        datepicker:false,
        format:'H:i',
        defaultTime:'08:00',
        onChangeDateTime:logic,
        onShow:logic
    });

    $newCourseTime.find('.new-course-time-template-duration').attr('name', `times[${courseTimesCount}][duration]`);
    $newCourseTime.find('.new-course-time-template-room').attr('name', `times[${courseTimesCount}][room]`);
    $newCourseTime.find('.course-time-delete').click(deleteCourseTime.bind(this, _id));

    $newCourseTime.attr('id', _id);
    $newCourseTime.removeClass('new-course-time-template');
    $newCourseTime.addClass('course-time');
    courseTimesCount++;

    $courseTimesTable.append($newCourseTime);
    return $newCourseTime;
};

/** fills an empty course-time row with data **/
let populateCourseTime = function($courseTimeRow, data) {
    $courseTimeRow.find('.new-course-time-template-weekday').val(data.weekday);
	$courseTimeRow.find('.new-course-time-template-weekday').trigger('chosen:updated');
	$courseTimeRow.find('.new-course-time-template-startTime').val(data.startTime);
    $courseTimeRow.find('.new-course-time-template-duration').val(data.duration);
    $courseTimeRow.find('.new-course-time-template-room').val(data.room);

};

$(document).ready(function() {
	$('.new-course-time-add').click(function (e) {
		// fallback if multiple time-containers are on one page, e.g. in administration
		let $timesContainer = $($(this).attr('data-timesref'));
		addNewCourseTime($timesContainer);
	});

	$('.course-time-delete').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		deleteCourseTime($(this).data("id"));
	});
})
