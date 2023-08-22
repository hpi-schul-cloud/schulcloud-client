$(() => {
	const $selectDropdownLists = $('.chosen-container .chosen-results');

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			const $select = $(mutation.target).closest('.chosen-container').prev('select');

			$select.find('option').each((index, element) => {
				if ($(element).prop('hidden')) {
					$(mutation.target).find(`li[data-option-array-index="${index}"]`).prop('hidden', true);
				}
			});
		});
	});

	$selectDropdownLists.each((index) => {
		observer.observe($selectDropdownLists[index], {
			childList: true,
		});
	});
});
