import moment from 'moment';
//import 'jquery-datetimepicker';
import './jquery/datetimepicker-easy.js';
import 'script-loader!fullcalendar/dist/fullcalendar.min.js';
import 'script-loader!fullcalendar/dist/locale/de.js';

$(document).ready(function () {
    var $calendar = $('#calendar');

    var view = location.hash.substring(1);

    var $createEventModal = $('.create-event-modal');
    var $editEventModal = $('.edit-event-modal');

    var reloadCalendar = function() {
        window.location.reload();
    };

    function showAJAXError(req, textStatus, errorThrown) {
        $editEventModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn");
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    /**
     * transform a event modal-form for course events
     * @param modal {DOM-Element} - the given modal which will be transformed
     * @param event {object} - a event, maybe a course-event
     */
    function transformCourseEvent(modal, event) {
        var courseId = event["x-sc-courseId"];
        if (courseId) {
            $.getJSON("/courses/" + courseId + "/json", function (course) {
                var $title = modal.find(".modal-title");
                $title.html($title.html() + " , Kurs: " + course.course.name);

                // if not teacher, not allow editing course events
                if($('.create-course-event').length <= 0) {
                    modal.find(".modal-form :input").attr("disabled", true);
                }

                // set fix course on editing
                modal.find("input[name='scopeId']").attr("value", event["x-sc-courseId"]);
                modal.find(".modal-form").append("<input name='courseId' value='" + courseId +"' type='hidden'>");
                modal.find(".create-course-event").remove();

            });
        }
    }

    $calendar.fullCalendar({
        defaultView: view || 'month',
        editable: false,
        timezone: 'UTC',
        events: function (start, end, timezone, callback) {
            $.getJSON('/calendar/events/',
                function (events) {
                    callback(events);
                });
        },
        eventRender: function (event, element) {
            if (event.cancelled) {
                element.addClass('fc-event-cancelled');
            }
        },
        eventClick: function(event) {
            if (event.url) {
                window.location.href = event.url;
                return false;
            } else {
                // personal event
                event.startDate = event.start.format("DD.MM.YYYY HH:mm");
                event.endDate = (event.end || event.start).format("DD.MM.YYYY HH:mm");

                populateModalForm($editEventModal, {
                    title: 'Termin - Details',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: event,
                    action: '/calendar/events/' + event.attributes.uid
                });

                transformCourseEvent($editEventModal, event);

                $editEventModal.find('.btn-delete').click(e => {
                    $.ajax({
                        url: '/calendar/events/' + event.attributes.uid,
                        type: 'DELETE',
                        error: showAJAXError,
                        success: function(result) {
                            reloadCalendar();
                        },
                    });
                });
                $editEventModal.appendTo('body').modal('show');
            }
        },
        dayClick: function(date, jsEvent, view) {

            // open create event modal
            var _startDate = date.format("DD.MM.YYYY HH:mm");
            var _endDate = date.add(1, 'hour').format("DD.MM.YYYY HH:mm");

            populateModalForm($createEventModal, {
                title: 'Termin hinzufügen',
                closeLabel: 'Abbrechen',
                submitLabel: 'Hinzufügen',
                fields: {
                    startDate: _startDate,
                    endDate: _endDate
                }
            });
            $createEventModal.appendTo('body').modal('show');
        },
        header: {
            left: 'title',
            right: 'month,agendaWeek,agendaDay prev,today,next'
        },
        locale: 'de',
        viewRender: function (view, element) {
            location.hash = view.name;
        }
    });

    $('.fc-left > button')
        .wrap('<div class="fc-button-group"></div>');

    $('.fc-button')
        .removeClass('fc-button fc-corner-left fc-corner-right')
        .addClass('btn btn-secondary');

    $('.fc-button-group')
        .removeClass()
        .addClass('btn-group btn-group-sm');

/*
    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({
        format:'d.m.Y H:i',
        mask: '39.19.9999 29:59'
    });*/

    $("input[name='isCourseEvent']").change(function(e) {
        var isChecked = $(this).is(":checked");
        var $collapse = $("#" + $(this).attr("data-collapseRef"));
        var $selection = $collapse.find('.course-selection');
        $selection.find('option')
            .remove()
            .end();

        if (isChecked) {
            // fetch all courses for teacher and show selection
            $.getJSON('/courses?json=true', function(courses) {
                $collapse.collapse('show');
                courses.forEach(function (course) {
                    var option = document.createElement("option");
                    option.text = course.name;
                    option.value = course._id;
                    $selection.append(option);
                });
                $selection.chosen().trigger("chosen:updated");

            });
        } else {
            $collapse.collapse('hide');
        }
    });

});

window.addEventListener('DOMContentLoaded', function() {
    moment().format();
});