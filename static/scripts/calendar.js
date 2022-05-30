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
		prev: localFile['calendar.buttonText.prev'],
		next: localFile['calendar.buttonText.next'],
		today: localFile['calendar.buttonText.today'],
		year: localFile['calendar.buttonText.year'],
		month: localFile['calendar.buttonText.month'],
		week: localFile['calendar.buttonText.week'],
		day: localFile['calendar.buttonText.day'],
		list: localFile['calendar.buttonText.list'],
	},
	weekLabel: localFile['calendar.weekLabel'],
	allDayText: localFile['calendar.allDayText'],
	eventLimitText(n) {
		return `+ ${localFile['calendar.eventLimitText']} ${n}`;
	},
	noEventsMessage: localFile['calendar.noEventsMessage'],
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
	const URI = {
		courseList: '/courses/getNames',
		teamList: '/teams?json=true',
		eventList: '/calendar/events',
		getSingleCourse: (courseId) => `/courses/${courseId}/json`,
		getSingleTeam: (teamId) => `/teams/${teamId}/json`,
		getSingleEvent: (eventId) => `/calendar/events/${eventId}`,
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
	 * @param modal {HTMLElement} - the given modal which will be transformed
	 * @param event {Object} - an event, might be a course/team event
	 */
	function transformCourseOrTeamEvent(modal, event) {
		if (event['x-sc-courseId']) {
			const courseId = event['x-sc-courseId'];
			$.getJSON(URI.getSingleCourse(courseId), (course) => {
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
			$.getJSON(URI.getSingleTeam(teamId), (team) => {
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
			left: 'title prev,timeGridDay,timeGridWeek,dayGridMonth,next,today',
			right: 'prev,timeGridDay,timeGridWeek,dayGridMonth,next,today',
		},
		events: (info, successCallback) => {
			$.getJSON(URI.eventList, (events) => successCallback(events));
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
				action: URI.getSingleEvent(eventData._id),
			});

			if (!eventData['x-sc-teamId']) { // course or non-course event
				transformCourseOrTeamEvent($editEventModal, eventData);
				$editEventModal.find('.btn-delete').click(() => {
					$.ajax({
						url: URI.getSingleEvent(eventData._id),
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

	const isChecked = (event) => {
		const checked = $(event.target).is(':checked');

		return checked;
	};

	const TOGGLE = {
		last: -1,
		next: 1,
	};

	const getRefId = (event) => $(event.target).attr('data-Ref');
	const getDefaultText = (event) => $(event.target).attr('data-defauttext');

	const hideArea = (id) => {
		$(`#collapse${id}`).hide();
		$(`#collapse${id}`).find('select').hide();
	};

	const showArea = (id) => {
		$(`#collapse${id}`).show();
		$(`#collapse${id}`).find('select').show();
	};

	const hideAreaByEvent = (event) => {
		const refId = getRefId(event);
		hideArea(refId);
		$('.create-videoconference').hide();
	};

	const toggle = (event, relativeTogglePosition) => {
		const refId = getRefId(event);
		const toggleId = Number(refId) + relativeTogglePosition;

		hideArea(2);
		hideArea(3);
		hideArea(4);
		hideArea(5);
		$(`#toggle${toggleId}`).bootstrapToggle('off');

		showArea(refId);
	};

	const errorHandler = (jqxhr, textStatus, err) => {
		// eslint-disable-next-line no-console
		console.error(err);
	};

	const addOptionsToSelection = (event, data) => {
		const ref = getRefId(event);

		// hard killed auto generated "_chosen" otherwise it is always displayed twice
		$(`#selection${ref}_chosen`).hide();

		const $selection = $(`#selection${ref}`);
		$selection.find('option').remove();

		const defaultText = getDefaultText(event);
		$selection.append(`<option aria-label="${defaultText}" value="" selected hidden>${defaultText}</option>`);

		data.forEach((d) => {
			$selection.append(`<option aria-label="${d.name}" value="${d._id}">${d.name}</option>`);
		});
	};

	/**
	 * important look into calendar.hbs the form-create-event.hbs
	 * is execute twice and generate invalid html with double usedIds
	 * see also collapeseIdCourse or collapesedIdTeam
	 * events are also bind to twice
	 * */
	$("input[name='isCourseEvent']").change((event) => {
		if (isChecked(event)) {
			$.getJSON(URI.courseList, (courses) => {
				toggle(event, TOGGLE.next);
				addOptionsToSelection(event, courses);
			}).fail(errorHandler);
		} else {
			hideAreaByEvent(event);
		}
	});

	$("input[name='isTeamEvent']").change((event) => {
		if (isChecked(event)) {
			$.getJSON(URI.teamList, (teams) => {
				toggle(event, TOGGLE.last);
				addOptionsToSelection(event, teams);
				$('.create-videoconference').show();
			}).fail(errorHandler);
		} else {
			hideAreaByEvent(event);
		}
	});
});
