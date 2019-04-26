import moment from 'moment';
import 'jquery-datetimepicker';

/**
 * transform a event modal-form for course events
 * @param modal {DOM-Element} - the given modal which will be transformed
 * @param event {object} - a event, maybe a course-event
 */
function transformCourseOrTeamEvent(modal, event) {
	if (event['x-sc-courseId']) {
		const courseId = event['x-sc-courseId'];
		$.getJSON(`/courses/${  courseId  }/json`, (course) => {
			let $title = modal.find('.modal-title');
			$title.html(`${$title.html()  } , Kurs: ${  course.course.name}`);

			// if not teacher, not allow editing course events
			if ($('.create-course-event').length <= 0) {
				modal.find('.modal-form :input').attr('disabled', true);
			}

			// set fix course on editing
			modal.find("input[name='scopeId']").attr('value', event['x-sc-courseId']);
			modal.find('.modal-form').append(`<input name='courseId' value='${  courseId }' type='hidden'>`);
			modal.find('.create-course-event').remove();
			modal.find('.create-team-event').remove();
		});
	} else if (event['x-sc-teamId']) {
		const teamId = event['x-sc-teamId'];
		$.getJSON(`/teams/${  teamId  }/json`, (team) => {
			let $title = modal.find('.modal-title');
			$title.html(`${$title.html()  } , Team: ${  team.team.name}`);

			// if not teacher, not allow editing team events
			if ($('.create-team-event').length <= 0) {
				modal.find('.modal-form :input').attr('disabled', true);
			}

			// set fix team on editing
			modal.find("input[name='scopeId']").attr('value', event['x-sc-teamId']);
			modal.find('.modal-form').append(`<input name='teamId' value='${  teamId }' type='hidden'>`);
			modal.find('.create-team-event').remove();
			modal.find('.create-course-event').remove();
		});
	}
}

$(document).ready(() => {
	let $createEventModal = $('.create-event-modal');
	let $editEventModal = $('.edit-event-modal');
	let $filePermissionsModal = $('.file-permissions-modal');

	const handler = {
		get (target, name) {
      return name in target ?
        target[name] :
        '';
    },
		set (obj, prop, value) {
      obj[prop] = value;
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set#Return_value
      return obj[prop] === value;
    },
	};

	const state = new Proxy({
		currentEvent: {},
	}, handler);

	$('.btn-create-event').click((e) => {
    // open create event modal
    var _startDate = moment().format("DD.MM.YYYY HH:mm");
    var _endDate = moment().add(1, 'hour').format("DD.MM.YYYY HH:mm");

    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({
      format:'d.m.Y H:i',
      mask: '39.19.9999 29:59'
    });

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

	$('.btn-edit-event').click(function (e) {
    e.preventDefault();	
    const event = $(this).parents('.events-card').data('event');
    event.start = moment(event.start);
    event.end = moment(event.end);
    state.event = event;

    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({
      format:'d.m.Y H:i',
      mask: '39.19.9999 29:59'
    });    

    if (event.url) {
        window.location.href = event.url;
        return false;
    } 
        // personal event
        event.startDate = event.start.format("DD.MM.YYYY HH:mm");
        event.endDate = (event.end || event.start).format("DD.MM.YYYY HH:mm");
        populateModalForm($editEventModal, {
            title: 'Termin - Details',
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: event,
            action: '/teams/calendar/events/' + event.attributes.uid
        });

        transformCourseOrTeamEvent($editEventModal, event);

        $editEventModal.find('.btn-delete').click(e => {
            $.ajax({
                url: '/calendar/events/' + event.attributes.uid,
                type: 'DELETE',
                success: function(result) {
                    window.location.reload();
                },
            });
        });
        $editEventModal.appendTo('body').modal('show');
    
  });

	$editEventModal.on('submit', (e) => {
    e.stopPropagation();
    e.preventDefault();

    $.ajax({
        url: '/teams/events/' + state.event.attributes.uid,
        type: 'PUT',
        data: $('.edit-event-modal form').serialize(),
        success: function(result) {
            window.location.reload();
        },
    });
  });

	$('.btn-file-permissions').click((e) => {
    populateModalForm($filePermissionsModal, {
        title: 'Freigabe-Einstellungen ändern',
        closeLabel: 'Abbrechen',
        submitLabel: 'Speichern',
    });
    $filePermissionsModal.appendTo('body').modal('show');
  });

	$('.file-permissions-modal form').on('submit', (e) => {
    e.stopPropagation();
    e.preventDefault();

    $.ajax({
      url: '/teams/' + $('.section-teams').data('id') + '/json',
      method: 'GET'
    })
    .done(function(data) {
      const allowed = {
        'teamexpert': $('.file-permissions-modal input[name="externalExperts"]').prop('checked'),
        'teammember': $('.file-permissions-modal input[name="teamMembers"]').prop('checked'),
      };

      const filePermission = data.team.filePermission;

      const newPermission = filePermission
        .filter(permission => ['teamexpert', 'teammember'].indexOf(permission.roleName) > -1)
        .map(permission => {

            const setPermission = ['create', 'read', 'delete', 'write'].reduce((obj, right) => {
                obj[right] = allowed[permission.roleName];
                return obj;
            }, {});

            return Object.assign(permission, setPermission);
        });  

      $.ajax({
        url: '/teams/' + $('.section-teams').data('id') + '/permissions',
        method: 'PATCH',
        data: { filePermission: Object.assign(filePermission, newPermission) }
      })
      .done(function() {
        $.showNotification('Standard-Berechtigungen erfolgreich geändert', "success", true);
        $('.file-permissions-modal').modal('hide');
      })
      .fail(function() {
        $.showNotification('Problem beim Ändern der Berechtigungen', "danger", true);
      });
    })
    .fail(function() {
      $.showNotification('Problem beim Ändern der Berechtigungen', "danger", true);
    });
  });

	/**
   	* Leave Team
   	*
   	*/
	$('.dropdown-leave-team').click(function leaveTeam(e) {
		e.stopPropagation();
		e.preventDefault();
		const $leaveTeamModal = $('.leave-team-modal');
		const userId = $(this).data('user-id');
		populateModalForm($leaveTeamModal, {
			title: 'Team verlassen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Team verlassen',
			payload: { userId },
		});

		const $modalForm = $leaveTeamModal.find('.modal-form');
		$leaveTeamModal.appendTo('body').modal('show');
	});

	$('.leave-team-modal form').on('submit', function leaveTeamModal(e) {
		e.stopPropagation();
		e.preventDefault();
		const userIdToRemove = $(this).data('payload').userId;

		$.ajax({
			url: $(this).attr('action'),
			method: 'DELETE',
			data: {
				userIdToRemove,
			},
		}).done(() => {
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Löschen des Teilnehmers', 'danger', true);
		});

		return false;
	});
});
