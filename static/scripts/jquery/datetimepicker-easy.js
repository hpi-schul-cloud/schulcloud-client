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
			const {
				format, mask, datetime, startDate, minDate, maxDate, inline,
			} = (input || {}).dataset;
			return {
				format: format || (input.dataset.datetime !== undefined ? 'd.m.Y H:i' : 'd.m.Y'),
				mask: mask || (input.dataset.datetime !== undefined ? '39.19.9999 29:59' : '39.19.9999'),
				timepicker: (datetime !== undefined || false),
				startDate,
				minDate, // default: unlimited minimum date
				maxDate, // default: unlimited maximum date
				inline: (inline === 'true'),
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
		});
	};
	document.addEventListener('DOMContentLoaded', window.datetimepicker);
}
