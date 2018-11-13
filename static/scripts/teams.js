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


    $.ajax({
      url: '/teams/' + $('.section-teams').data('id') + '/json',
      method: 'GET'
    }).done(function(data) {
      let filePermission = data.team.filePermission
      let allowExternalExperts = $('input[name="externalExperts"]').prop('checked')
      let allowMembers = $('input[name="teamMembers"]').prop('checked')

      filePermission = filePermission.map(permission => {
        if (permission.roleName === 'teamexpert') {
          permission = Object.assign(permission, {
            create: allowExternalExperts,
            read: allowExternalExperts,
            delete: allowExternalExperts,
            write: allowExternalExperts
          })
        } else if (permission.roleName === 'teammember') {
          permission = Object.assign(permission, {
            create: allowMembers,
            read: allowMembers,
            delete: allowMembers,
            write: allowMembers
          })
        }

        return permission
      })

      $.ajax({
        url: '/teams/' + $('.section-teams').data('id') + '/permissions',
        method: 'PATCH',
        data: {
          filePermission
        }
      }).done(function() {
        $.showNotification('Standard Berechtigungen erfolgreich geändert', "success", true);
      }).fail(function() {
        $.showNotification('Problem beim Ändern der Berechtigungen', "danger", true);
      });
    }).fail(function() {
      $.showNotification('Problem beim Ändern der Berechtigungen', "danger", true);
    });

    return false;
  });
});