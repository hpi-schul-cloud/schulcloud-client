$(document).ready(function () {
    var $calendar = $('#calendar');

    var view = location.hash.substring(1);
    $calendar.fullCalendar({
        defaultView: view || 'month',
        editable: false,
        events: function (start, end, timezone, callback) {
            /*
             $.getJSON('/calendar/events/', {
             start: start.unix(),
             end: end.unix()
             },
             function(events) {
             callback(events);
             });
             */
            callback([
                {
                    "id": "58de50cfce86cd4303ca841d",
                    "summary": "Legend Summer Party",
                    "location": "HPI, Potsdam",
                    "description": "For students, alumni and special guests only",
                    "title": "Elternabend",
                    "allDay": true,
                    "start": 1491343200000,
                    "end": 1491343200000,
                    "url": ""
                },
                {
                    "id": "58de50cfce86cd4303ca841d",
                    "summary": "Legend Summer Party",
                    "location": "HPI, Potsdam",
                    "description": "For students, alumni and special guests only",
                    "title": "Dienstberatung",
                    "allDay": true,
                    "start": 1491429600000,
                    "end": 1491429600000,
                    "url": ""
                },
                {
                    "id": "58de50cfce86cd4303ca841d",
                    "summary": "Legend Summer Party",
                    "location": "HPI, Potsdam",
                    "description": "For students, alumni and special guests only",
                    "title": "Treffen Fachschaft Mathematik",
                    "allDay": true,
                    "start": 1493244000000,
                    "end": 1493244000000,
                    "url": ""
                },
                {
                    "id": "58de50cfce86cd4303ca841d",
                    "summary": "Legend Summer Party",
                    "location": "HPI, Potsdam",
                    "description": "For students, alumni and special guests only",
                    "title": "Osterferien",
                    "allDay": true,
                    "start": 1491861600000,
                    "end": 1492898340000,
                    "url": ""
                }
            ]);


        },
        eventRender: function (event, element) {
            if (event.cancelled) {
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