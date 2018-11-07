import moment from 'moment';

$(document).ready(function () {
  var $createEventModal = $('.create-event-modal');
  var $filePermissionsModal = $('.file-permissions-modal');

  $('.btn-create-event').click(function (e) {
    // open create event modal
    var _startDate = moment().format("DD.MM.YYYY HH:mm");
    var _endDate = moment().add(1, 'hour').format("DD.MM.YYYY HH:mm");

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
  });

  $('.btn-file-permissions').click(function (e) {
    // open create event modal

    populateModalForm($filePermissionsModal, {
        title: 'Freigabe-Einstellungen ändern',
        closeLabel: 'Abbrechen',
        submitLabel: 'Speichern',
    });
    $filePermissionsModal.appendTo('body').modal('show');
  });

  $('.file-permissions-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();

    console.log('OK!!')

    // $.ajax({
    //   url: $(this).attr('action'),
    //   method: 'POST',
    //   data: {}
    // }).done(function() {
    //   $.showNotification('Teilnehmer erfolgreich zum Team hinzugefügt', "success", true);
    //   location.reload();
    // }).fail(function() {
    //   $.showNotification('Problem beim Hinzufügen der Teilnehmer', "danger", true);
    // });

    return false;
  });
});