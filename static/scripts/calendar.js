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

    $calendar.fullCalendar({
        defaultView: view || 'month',
        editable: false,
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

                // moment escapes 'T' to PM or AM
                event.startDate = event.start.format("YYYY-MM-DD") + 'T' + event.start.format("hh:mm");
                event.endDate = (event.end || event.start).format("YYYY-MM-DD") + 'T' + (event.end || event.start).add(1, 'hour').format("hh:mm");

                populateModalForm($editEventModal, {
                    title: 'Termin - Details',
                    closeLabel: 'Schließen',
                    submitLabel: 'Speichern',
                    fields: event,
                    action: '/calendar/events/' + event.attributes.uid
                });

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
                $editEventModal.modal('show');
            }
        },
        dayClick: function(date, jsEvent, view) {

            // open create event modal, moment escapes 'T' to PM or AM
            var _startDate = date.format("YYYY-MM-DD") + 'T' + date.add(9, 'hour').format("hh:mm");
            var _endDate = date.format("YYYY-MM-DD") + 'T' + date.add(1, 'hour').format("hh:mm");

            populateModalForm($createEventModal, {
                title: 'Termin hinzufügen',
                closeLabel: 'Schließen',
                submitLabel: 'Hinzufügen',
                fields: {
                    startDate: _startDate,
                    endDate: _endDate
                }
            });
            $createEventModal.modal('show');
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