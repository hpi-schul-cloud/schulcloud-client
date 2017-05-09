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

    var populateModalForm = function(modal, data) {

        var $title = modal.find('.modal-title');
        var $btnSubmit = modal.find('.btn-submit');
        var $btnClose = modal.find('.btn-close');
        var $form = modal.find('.modal-form');

        $title.html(data.title);
        $btnSubmit.html(data.submitLabel);
        $btnClose.html(data.closeLabel);

        if(data.action) {
            console.log(data.action);
            $form.attr('action', data.action);
        }

        // fields
        $('[name]', $form).not('[data-force-value]').each(function () {
            var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
            switch ($(this).prop("type")) {
                case "radio":
                    if(typeof(value) === "boolean"){value = value?"1":"0";}
                    if(value === ""){value = "0";}
                    if (($(this).attr('name') == $(this).prop('name'))&&($(this).attr('value')==value)){
                        $(this).attr("checked","checked");
                    }else{
                        $(this).removeAttr("checked");
                    }
                    break;
                case "checkbox":
                    $(this).each(function () {
                        if (($(this).attr('name') == $(this).prop('name'))){
                            $(this).attr("checked", value);
                        }else{
                            $(this).removeAttr("checked");
                        }
                    });
                    break;
                case "datetime-local":
                    $(this).val(value.slice(0,16)).trigger("chosen:updated");
                    break;
                case "date":
                    $(this).val(value.slice(0,10)).trigger("chosen:updated");
                    break;
                case "color":
                    $(this).attr("value", value);
                    $(this).attr("placeholder", value);
                    break;
                default:
                    $(this).val(value).trigger("chosen:updated");
            }
        });
    };

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
                event.endDate = event.end.format("YYYY-MM-DD") + 'T' + event.end.add(1, 'hour').format("hh:mm");

                populateModalForm($editEventModal, {
                    title: 'Termin - Details',
                    closeLabel: 'Schließen',
                    submitLabel: 'Speichern',
                    fields: event
                });

                $editEventModal.find('.btn-delete').click(e => {
                    console.log(event);
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

                // todo: delete this if update-function is implemented
                $editEventModal.find('.btn-submit').prop('disabled', true);
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