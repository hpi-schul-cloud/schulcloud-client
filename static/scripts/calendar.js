import moment from 'moment';
import './jquery/datetimepicker-easy.js';
import 'script-loader!fullcalendar/dist/fullcalendar.min.js';
import 'script-loader!fullcalendar/dist/locale/de.js';

$(document).ready(() => {
	const $calendar = $('#calendar');

	const view = location.hash.substring(1);

	const $createEventModal = $('.create-event-modal');
	const $editEventModal = $('.edit-event-modal');

	const reloadCalendar = function () {
		window.location.reload();
	};

	function showAJAXError(req, textStatus, errorThrown) {
		$editEventModal.modal('hide');
		if (textStatus === 'timeout') {
			$.showNotification($t('global.text.requestTimeout'), 'warn');
		} else {
			$.showNotification(errorThrown, 'danger');
		}
	}

	/**
     * Transforms an event modal-form for course/team events
     * @param modal {DOM-Element} - the given modal which will be transformed
     * @param event {object} - an event, might be a course/team event
     */
	function transformCourseOrTeamEvent(modal, event) {
		if (event['x-sc-courseId']) {
			const courseId = event['x-sc-courseId'];
			$.getJSON(`/courses/${courseId}/json`, (course) => {
				const $title = modal.find('.modal-title');
				$title.html(`${$title.html()}, Kurs: ${course.course.name}`);

				// if not teacher, not allow editing course events
				if ($('.create-course-event').length <= 0) {
					modal.find('.modal-form :input').attr('disabled', true);
				}

				// set fix course on editing
				modal.find("input[name='scopeId']").attr('value', event['x-sc-courseId']);
				modal.find('.modal-form').append(`<input name='courseId' value='${courseId}' type='hidden'>`);
				modal.find('.create-course-event').remove();
				modal.find('.create-team-event').remove();
			});
		} else if (event['x-sc-teamId']) {
			const teamId = event['x-sc-teamId'];
			$.getJSON(`/teams/${teamId}/json`, (team) => {
				const $title = modal.find('.modal-title');
				$title.html(`${$title.html()}, Team: ${team.team.name}`);

				// if not teacher, don't allow editing team events
				if ($('.create-team-event').length <= 0) {
					modal.find('.modal-form :input').attr('disabled', true);
				}

				// set fix team on editing
				modal.find("input[name='scopeId']").attr('value', event['x-sc-teamId']);
				modal.find('.modal-form').append(`<input name='teamId' value='${teamId}' type='hidden'>`);
				modal.find('.create-team-event').remove();
				modal.find('.create-course-event').remove();
			});
		}
	}

	$calendar.fullCalendar({
		defaultView: view || 'agendaWeek',
		editable: false,
		timezone: 'UTC',
		events(start, end, timezone, callback) {
			$.getJSON('/calendar/events/',
				(events) => {
					callback(events);
				});
		},
		eventRender(event, element) {
			if (event.cancelled) {
				element.addClass('fc-event-cancelled');
			}
		},
		// eslint-disable-next-line consistent-return
		eventClick(event) {
			if (event.url) {
				window.location.href = event.url;
				return false;
			}
			// personal event
			event.startDate = event.start.format('DD.MM.YYYY HH:mm');
			event.endDate = (event.end || event.start).format('DD.MM.YYYY HH:mm');

			populateModalForm($editEventModal, {
				title: $t('global.headline.dateDetails'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.save'),
				fields: event,
				action: `/calendar/events/${event.attributes.uid}`,
			});

			if (!event['x-sc-teamId']) { // course or non-course event
				transformCourseOrTeamEvent($editEventModal, event);
				$editEventModal.find('.btn-delete').click(() => {
					$.ajax({
						url: `/calendar/events/${event.attributes.uid}`,
						type: 'DELETE',
						error: showAJAXError,
						success(result) {
							reloadCalendar();
						},
					});
				});
				$editEventModal.appendTo('body').modal('show');
			}

			if (event['x-sc-teamId']) { // team event
				const teamId = event['x-sc-teamId'];
				window.location.assign(`/teams/${teamId}?activeTab=events`);
			}
		},
		dayClick(date) {
			// open create event modal
			const startDate = date.format('DD.MM.YYYY HH:mm');
			const endDate = date.add(1, 'hour').format('DD.MM.YYYY HH:mm');

			populateModalForm($createEventModal, {
				title: $t('global.headline.addDate'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.add'),
				fields: {
					startDate,
					endDate,
				},
			});
			$createEventModal.appendTo('body').modal('show');
		},
		header: {
			left: 'title',
			right: 'month,agendaWeek,agendaDay prev,today,next',
		},
		locale: 'de',
		viewRender() {
			// eslint-disable-next-line no-restricted-globals
			location.hash = view.name;
		},
	});

	$('.fc-left > button')
		.wrap('<div class="fc-button-group"></div>');

	$('.fc-button')
		.removeClass('fc-button fc-corner-left fc-corner-right')
		.addClass('btn btn-secondary');

	$('.fc-button-group')
		.removeClass()
		.addClass('btn-group btn-group-sm');


	$("input[name='isCourseEvent']").change(() => {
		const isChecked = $(this).is(':checked');
		const ref = $(this).attr('data-collapseRef');
		const $collapse = $(`#${ref}`);
		const $selection = $collapse.find('.course-selection');
		$selection.find('option')
			.remove()
			.end();

		if (isChecked) {
			// fetch all courses for teacher and show selection
			$.getJSON('/courses?json=true', (courses) => {
				$collapse.collapse('show');
				const $toggleTeam = $(`#toggle${parseInt(ref.substr(ref.length - 1, ref.length), 10) + 1}`);
				$toggleTeam.bootstrapToggle('off');

				courses.forEach((course) => {
					const option = document.createElement('option');
					option.text = course.name;
					option.value = course._id;
					$selection.append(option);
				});
				$selection.chosen().trigger('chosen:updated');
			});
		} else {
			$collapse.collapse('hide');
		}
	});

	$("input[name='isTeamEvent']").change(() => {
		const isChecked = $(this).is(':checked');
		const ref = $(this).attr('data-collapseRef');
		const $collapse = $(`#${$(this).attr('data-collapseRef')}`);
		const $selection = $collapse.find('.team-selection');
		const $videoconferenceToggle = $('.create-videoconference');
		$selection.find('option')
			.remove()
			.end();

		if (isChecked) {
			// fetch all courses for teacher and show selection
			$.getJSON('/teams?json=true', (teams) => {
				$collapse.collapse('show');
				const $toggleTCourse = $(`#toggle${parseInt(ref.substr(ref.length - 1, ref.length), 10) - 1}`);
				$toggleTCourse.bootstrapToggle('off');
				teams.forEach((team) => {
					const option = document.createElement('option');
					option.text = team.name;
					option.value = team._id;
					$selection.append(option);
				});
				$selection.chosen().trigger('chosen:updated');
				$videoconferenceToggle.show();
			});
		} else {
			$collapse.collapse('hide');
			$videoconferenceToggle.hide();
		}
	});
});

window.addEventListener('DOMContentLoaded', () => {
	moment().format();
});
