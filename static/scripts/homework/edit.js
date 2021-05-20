const Mousetrap = require('../mousetrap/mousetrap');

window.addEventListener('DOMContentLoaded', () => {
	const lang = $('html').attr('lang');
	$.datetimepicker.setLocale(lang || 'de');
	const datePickerMask = $t('format.datePickerMask');
	const datePickerPlaceholder = datePickerMask.replace(/[0-9]/g, '_');
	$('input[data-datetime]').datetimepicker({
		format: $t('format.dateTimePicker'),
		mask: $t('format.dateTimePickerMask'),
		formatDate: $t('format.datePicker'),
		formatTime: 'H:i',
		dayOfWeekStart: 1,
		onShow(ct, input) {
			if (input[0].id === 'availableDate') {
				const due = $('#dueDate').val().split(' ');
				this.setOptions({
					minDate: 0,
					maxDate: (due[0] !== datePickerPlaceholder) ? due[0] : false,
					defaultDate: new Date(),
				});
			} else if (input[0].id === 'dueDate') {
				const available = $('#availableDate').val().split(' ');
				this.setOptions({
					minDate: (available[0] !== datePickerPlaceholder) ? available[0] : 0,
					maxDate: false,
				});
			}
		},
		onChangeDateTime(ct, input) {
			const due = $('#dueDate').val().split(' ');
			if (input[0].id === 'availableDate' && (due[0] === datePickerPlaceholder || due[0] === '')) {
				const available = $('#availableDate').val();
				if (available !== '') {
					$('#dueDate').val(available);
				}
			}
		},
	});

	Mousetrap.bind(['command+s', 'ctrl+s'], () => {
		document.getElementById('homework-form').submit();
		return false;
	});

	$('#coursePicker').change((e, s) => {
		if (s.selected !== '') {
			$('#lessonPicker').empty().append(`<option value="">${$t('homework.text.loading')}</option>`);
			$('#lessonPicker').prop('disabled', true);
			$.ajax({
				url: `/courses/${s.selected}/json`,
			}).done((r) => {
				const lessonPicker = $('#lessonPicker').empty();
				if (r.lessons.data.length > 0) {
					(r.lessons.data || []).sort((a, b) => ((a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1));
					lessonPicker.append(`<option value="">${$t('homework.global.text.noTopicsInTheCourse')}</option>`);
					for (let i = 0; i < r.lessons.data.length; i += 1) {
						$('#lessonPicker')
							.append(`<option value="${r.lessons.data[i]._id}">${r.lessons.data[i].name}</option>`);
					}
					$('#lessonPicker').prop('disabled', false);
					$('#lessonPicker').trigger('chosen:updated');
				} else {
					lessonPicker.append(`<option value="">${$t('homework.global.text.noTopicsInTheCourse')}</option>`);
				}
				$('#lessonPicker').trigger('chosen:updated');
			});
		} else {
			$('#lessonPicker').empty()
				.append(`<option value="">${$t('homework.global.text.noTopicsInTheCourse')}</option>`)
				.prop('disabled', true);
			$('#lessonPicker').trigger('chosen:updated');
		}
	});

	$('#teamSubmissions').on('change', () => {
		if (document.getElementById('teamSubmissions').checked) {
			$('#teamsize').removeClass('hidden-xl-down');
		} else {
			$('#teamsize').addClass('hidden-xl-down');
		}
	});
});
