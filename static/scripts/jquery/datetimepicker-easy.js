import 'jquery-datetimepicker';

if (!window.datetimepicker) {
	window.datetimepicker = () => {
		/* DATE(-TIME) PICKER */
		function triggerInputEvent(currentDateTime) {
			const event = new CustomEvent('input', {
				bubbles: true,
				cancelable: true,
			});
			this[0].ownerDocument.activeElement.dispatchEvent(event);
		}

		function readPickerConfig(input) {
			return {
				format: (input.dataset.datetime !== undefined ? 'd.m.Y H:i' : 'd.m.Y'),
				mask: (input.dataset.datetime !== undefined ? '39.19.9999 29:59' : '39.19.9999'),
				timepicker: (input.dataset.datetime !== undefined || false),
				startDate: (input.dataset.startDate),
				minDate: (input.dataset.minDate), // default: unlimited minimum date
				maxDate: (input.dataset.maxDate), // default: unlimited maximum date
				inline: (input.dataset.inline == 'true'),
				onChangeDateTime: triggerInputEvent,
			};
		}

		// https://xdsoft.net/jqplugins/datetimepicker/
		const lang = $('html').attr('lang');
		$.datetimepicker.setLocale(lang || 'de');
		document.querySelectorAll('input[data-date], input[data-datetime]').forEach((input) => {
			$(input).datetimepicker(readPickerConfig(input));
			$(input).datetimepicker('setOptions', {
				scrollMonth: false,
				scrollTime: false,
				scrollInput: false,
				dayOfWeekStart: 1,
			});
			input.setAttribute('autocomplete', 'off');
			if (input.hasAttribute('required')) {
				const dateRegex = '(3[01]|[12][0-9]|0?[1-9])\\.(1[012]|0?[1-9])\\.((?:19|20)\\d{2})';
				const timeRegex = '([01][0-9]|2[0-4])\\:[0-5][0-9]';
				const datetimeRegex = `${dateRegex}\\s${timeRegex}`;
				input.setAttribute('pattern', input.dataset.datetime !== undefined ? datetimeRegex : dateRegex);
			}
		});
	};
	document.addEventListener('DOMContentLoaded', window.datetimepicker);
}
