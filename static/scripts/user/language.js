/* eslint-disable func-names */
$(document).ready(() => {
	$('.dropdown-submenu a.toggle-dropdown').on('click', function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.stopImmediatePropagation();
		$(this).toggleClass('open');
		if (!$(this).next().hasClass('show')) {
			$(this)
				.parents('.dropdown-menu')
				.first()
				.find('.show')
				.removeClass('show');
		}
		const $subMenu = $(this).next('.dropdown-menu');
		$subMenu.toggleClass('show');

		$(this)
			.parents('li.nav-item.dropdown.show')
			.on('hidden.bs.dropdown', () => {
				$('.dropdown-submenu .show').removeClass('show');
			});

		return false;
	});

	$('#available-languages .dropdown-item').on('click', function () {
		const language = $(this).data('language');
		$.ajax({
			type: 'PATCH',
			url: `${window.location.origin}/users/language`,
			beforeSend(xhr) {
				xhr.setRequestHeader('Csrf-Token', csrftoken);
			},
			data: {
				language,
			},
			success() {
				window.location.reload();
			},
		});
	});
});
