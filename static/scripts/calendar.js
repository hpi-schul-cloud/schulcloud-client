$(document).ready(function() {
    var $calendar = $('#calendar');

    var view = location.hash.substring(1);
    $calendar.fullCalendar({
        defaultView: view || 'month',
        editable: false,
        events: function(start, end, timezone, callback) {
            $.getJSON('/calendar/events/', {
                start: start.unix(),
                end: end.unix()
            },
            function(events) {
                callback(events);
            });
        },
        eventRender: function (event, element) {
            if(event.cancelled) {
                element.addClass('fc-event-cancelled');
            }
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
});