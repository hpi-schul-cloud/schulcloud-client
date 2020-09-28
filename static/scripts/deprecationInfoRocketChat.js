const localStorageKey = 'rc-deprecation-info';

$(document).ready(() => {
	const deprecationInfoRocketChatModal = $('.deprecation-info-rocket-chat');

	if (deprecationInfoRocketChatModal.length === 0) return;

	if (localStorage.getItem(localStorageKey) !== 'true') deprecationInfoRocketChatModal.modal('show');

	deprecationInfoRocketChatModal.find('.btn-submit').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const checkboxValue = deprecationInfoRocketChatModal.find('.dontShowAgain-checkbox').prop('checked');
		localStorage.setItem(localStorageKey, checkboxValue);
		deprecationInfoRocketChatModal.modal('hide');
	});
});
