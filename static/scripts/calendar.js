import { Calendar } from '@fullcalendar/core';
import deLocale from '@fullcalendar/core/locales/de';
import enLocale from '@fullcalendar/core/locales/en-gb';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toMoment } from '@fullcalendar/moment';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import timeGridPlugin from '@fullcalendar/timegrid';
import ua from '../../locales/calendar/ua.json';
import './jquery/datetimepicker-easy';

const createCustomCalendarLocal = (langAttribute, localFile) => ({
	code: langAttribute,
	week: {
		dow: 1,
		doy: 4, // The week that contains Jan 4th is the first week of the year.
	},
	buttonText: {
		prev: localFile['buttonText.prev'],
		next: localFile['buttonText.next'],
		today: localFile['buttonText.today'],
		year: localFile['buttonText.year'],
		month: localFile['buttonText.month'],
		week: localFile['buttonText.week'],
		day: localFile['buttonText.day'],
		list: localFile['buttonText.list'],
	},
	weekLabel: localFile.weekLabel,
	allDayText: localFile.allDayText,
	eventLimitText(n) {
		return `+ ${localFile.eventLimitText} ${n}`;
	},
	noEventsMessage: localFile.noEventsMessage,
});

const getCalendarLanguage = (langAttribute) => {
	switch (langAttribute) {
		case 'de':
			return deLocale;
		case 'en':
			return enLocale;
		case 'es':
			return esLocale;
		case 'ua':
			return createCustomCalendarLocal('ua', ua);
		default:
			return deLocale; // use default from instance
	}
};

$(document).ready(() => {
	const $createEventModal = $('.create-event-modal');
	const $editEventModal = $('.edit-event-modal');

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
	 * @param modal {HTMLElement} - the given modal which will be transformed
	 * @param event {Object} - an event, might be a course/team event
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

	const getCalendarElement = () => document.getElementById('calendar');
	const getView = () => window.location.hash.substring(1);
	const getCalendarTimezone = () => document.querySelector('html').getAttribute('timezone') || 'Europe/Berlin';
	const getLangAttribute = () => document.querySelector('html').getAttribute('lang');

	const calendar = new Calendar(getCalendarElement(), {
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, momentTimezonePlugin],
		defaultView: getView() || 'dayGridMonth',
		editable: false,
		timeZone: getCalendarTimezone(),
		locale: getCalendarLanguage(getLangAttribute()),
		header: {
			left: 'title',
			right: 'dayGridMonth,timeGridWeek,timeGridDay prev,today,next',
		},
		events: (info, successCallback) => {
			$.getJSON('/calendar/events', (events) => successCallback(events));
		},
		eventRender(info) {
			if (info.event.cancelled) {
				info.element.addClass('fc-event-cancelled');
			}
		},
		eventClick: (info) => {
			const { event } = info;
			if (event.url) {
				window.location.href = event.url;
				return false;
			}
			// personal event
			const startDate = toMoment(event.start, calendar).format($t('format.dateTimeToPicker'));
			const endDate = toMoment(event.end || event.start, calendar).format($t('format.dateTimeToPicker'));

			const eventData = event.extendedProps || {};

			populateModalForm($editEventModal, {
				title: $t('global.headline.dateDetails'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.save'),
				fields: {
					summary: eventData.summary,
					startDate,
					endDate,
					description: eventData.description,
					location: eventData.location,
				},
				action: `/calendar/events/${eventData._id}`,
			});

			if (!eventData['x-sc-teamId']) { // course or non-course event
				transformCourseOrTeamEvent($editEventModal, eventData);
				$editEventModal.find('.btn-delete').click(() => {
					$.ajax({
						url: `/calendar/events/${eventData._id}`,
						type: 'DELETE',
						error: showAJAXError,
						success(result) {
							window.location.reload();
						},
					});
				});
				$editEventModal.appendTo('body').modal('show');
			}

			if (eventData['x-sc-teamId']) { // team event
				const teamId = eventData['x-sc-teamId'];
				window.location.assign(`/teams/${teamId}?activeTab=events`);
			}

			return true;
		},
		dateClick: (info) => {
			const { date } = info;

			// open create event modal
			const startDate = toMoment(date, calendar).format($t('format.dateTimeToPicker'));
			const endDate = toMoment(date, calendar).add(1, 'hour').format($t('format.dateTimeToPicker'));

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
		viewRender(info) {
			window.location.hash = info.view.name;
		},
	});

	calendar.render();

	$("input[name='isCourseEvent']").change((event) => {
		const input = event.target;
		const isChecked = $(input).is(':checked');
		const ref = $(input).attr('data-collapseRef');
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
			});
		} else {
			$collapse.collapse('hide');
		}
	});

	$("input[name='isTeamEvent']").change((event) => {
		const input = event.target;
		const isChecked = $(input).is(':checked');
		const ref = $(input).attr('data-collapseRef');
		const $collapse = $(`#${$(input).attr('data-collapseRef')}`);
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
				$videoconferenceToggle.show();
			});
		} else {
			$collapse.collapse('hide');
			$videoconferenceToggle.hide();
		}
	});
});
