/**
 * HELPER - addEventListener
 * 1. allow multiple events "clicked input" ...
 * 2. define addEventListener on NodeLists (document.querySelectorAll)
 */
function nodeListAddEventListener(events,
	callback,
	useCapture) {
	this.forEach((entry) => {
		events.split(' ').forEach((event) => {
			entry.addEventListener(event, callback, useCapture);
		});
	});
	return this;
}
if (!NodeList.prototype.addEventListener) {
	NodeList.prototype.addEventListener = nodeListAddEventListener;
}

// Polyfill for Edge 13 and other outdated browsers
if (!NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}

// if is needed for IE11
if (window.EventTarget) {
	const nativeEventListener = EventTarget.prototype.addEventListener;
	// eslint-disable-next-line no-inner-declarations
	function customAddEventListener(events, callback, useCapture) {
		this.nativeListener = nativeEventListener;
		events.split(' ').forEach((event) => {
			this.nativeListener(event, callback, useCapture);
		});
		return this;
	}
	EventTarget.prototype.addEventListener = customAddEventListener;
}

// IE11 Polyfill
// eslint-disable-next-line
Number.isInteger = Number.isInteger || (value => typeof value === 'number' && isFinite(value) && Math.floor(value) === value);

function populateModal(modal, identifier, data) {
	const block = modal.find(identifier);
	block.html(data);
}
window.populateModal = populateModal;

function populateModalForm(modal, data) {
	const $title = modal.find('.modal-title');
	const $btnSubmit = modal.find('.btn-submit');
	const $btnClose = modal.find('.btn-close');
	const $form = modal.find('.modal-form');

	$title.html(data.title);

	if (data.submitLabel) {
		$btnSubmit.html(data.submitLabel);
	} else {
		$btnSubmit.hide();
	}

	$btnClose.html(data.closeLabel);

	if (data.action) {
		$form.attr('action', data.action);
	}

	if (data.payload) {
		$form.attr('data-payload', JSON.stringify(data.payload));
	}

	function populateFormFields() {
		const value = (data.fields || {})[
			$(this)
				.prop('name')
				.replace('[]', '')
		] || '';

		function setCheckboxValue() {
			if (
				$(this).attr('name') === $(this).prop('name')
				&& value
			) {
				$(this).attr('checked', value);
			} else {
				$(this).removeAttr('checked');
			}
		}

		switch ($(this).prop('type')) {
			case 'radio':
			case 'checkbox':
				$(this).each(setCheckboxValue);
				break;
			case 'datetime-local':
				$(this)
					.val(value.slice(0, 16))
					.trigger('chosen:updated');
				break;
			case 'date':
				$(this)
					.val(value.slice(0, 10))
					.trigger('chosen:updated');
				break;
			case 'color':
				$(this).attr('value', value);
				$(this).attr('placeholder', value);
				break;
			default:
				if (
					$(this).prop('nodeName') !== 'TEXTAREA'
					|| !$(this).hasClass('customckeditor')
				) {
					$(this)
						.val(value)
						.trigger('chosen:updated');
				}
		}
	}
	// fields
	$('[name]', $form)
		.not('[data-force-value]')
		.each(populateFormFields);
}
window.populateModalForm = populateModalForm;

function printPart(event) {
	$(event.target).hide();
	const w = window.open();
	w.document.write(
		$(event.target)
			.parent('.print')
			.html(),
	);
	w.print();
	w.close();
	$(event.target).show();
}

// const originalReady = jQuery.fn.ready;
$.fn.extend({
	ready(handler) {
		$(document).on('pageload', handler);
	},
});
$(window).on('load', () => {
	$(document).trigger('pageload');
});
$(document).ready(() => {
	// Bootstrap Tooltips
	$('[data-toggle="tooltip"]').tooltip();

	// notification stuff
	const $notification = $('.notification');
	const $notificationContent = $notification.find('.notification-content');

	window.$.showNotification = (content, type, timeout) => {
		$notificationContent.html(content);

		// remove old classes in case type was set before
		$notification.removeClass();
		$notification.addClass(
			`notification alert alert-fixed alert-${type || 'info'}`,
		);

		$notification.fadeIn();

		if (timeout) {
			setTimeout(
				() => {
					$notification.fadeOut();
				},
				Number.isInteger(timeout) ? timeout : 5000,
			);
		}
	};

	window.$.hideNotification = () => $notification.fadeOut();

	$notification.find('.close').click(window.$.hideNotification);

	// disable autocomplete to "off" for all multi-selects without the attribute
	// to avoid visual overlapping
	document.querySelectorAll('select[multiple]').forEach((select) => {
		const value = select.getAttribute('autocomplete');
		if (value === null) {
			select.setAttribute('autocomplete', 'off');
		}
	});

	// Initialize bootstrap-select
	function dispatchInputEvent() {
		this.dispatchEvent(new CustomEvent('input'));
	}

	$('select:not(.no-bootstrap):not(.search-enabled)')
		.chosen({
			width: '100%',
			disable_search: true,
		})
		.change(dispatchInputEvent);
	$('select.search-enabled:not(.no-bootstrap)')
		.chosen({
			width: '100%',
			disable_search: false,
		})
		.change(dispatchInputEvent);

	// collapse toggle
	function toggleCollapse() {
		const $collapseToggle = $(this);
		const isCollapsed = $($collapseToggle.attr('href')).attr('aria-expanded');
		if (!isCollapsed || isCollapsed === 'false') {
			$collapseToggle
				.find('.collapse-icon')
				.removeClass('fa-chevron-right');
			$collapseToggle.find('.collapse-icon').addClass('fa-chevron-up');
		} else {
			$collapseToggle
				.find('.collapse-icon')
				.removeClass('fa-chevron-up');
			$collapseToggle.find('.collapse-icon').addClass('fa-chevron-right');
		}
	}
	$('.collapse-toggle').click(toggleCollapse);

	// eslint-disable-next-line func-names
	(function (a, b, c) {
		if (c in b && b[c]) {
			let d;
			const e = a.location;
			const f = /^(a|html)$/i;
			a.addEventListener(
				'click',
				// eslint-disable-next-line no-shadow
				(a) => {
					d = a.target;
					while (!f.test(d.nodeName)) d = d.parentNode;
					// eslint-disable-next-line no-unused-expressions
					'href' in d
						// eslint-disable-next-line no-bitwise
						&& (d.href.indexOf('http') || ~d.href.indexOf(e.host))
						&& (a.preventDefault(), (e.href = d.href));
				},
				!1,
			);
		}
	}(document, window.navigator, 'standalone'));

	// delete modals
	const $modals = $('.modal');
	const $deleteModal = $('.delete-modal');

	const nextPage = (href, blank = false) => {
		if (href) {
			if (blank) {
				window.open(href);
			} else {
				window.location.href = href;
			}
		} else {
			window.location.reload();
		}
	};

	function showAJAXError(req, textStatus, errorThrown) {
		$deleteModal.modal('hide');
		if (textStatus === 'timeout') {
			$.showNotification($t('global.text.requestTimeout'), 'warn', 30000);
		} else {
			$.showNotification(errorThrown, 'danger');
		}
	}

	function decodingHelper(encodedString) {
		const parser = new DOMParser();
		const dom = parser.parseFromString(
			`<!doctype html><body>${encodedString}`,
			'text/html',
		);
		const decodedString = dom.body.textContent;
		return decodedString;
	}

	function linkDeleteHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				$t('global.text.sureAboutDeleting', { name: decodingHelper($buttonContext.data('name')) }),
			);
		$deleteModal
			.find('.btn-submit')
			.unbind('click')
			.on('click', () => {
				$.ajax({
					url: $buttonContext.attr('href'),
					type: 'DELETE',
					error: showAJAXError,
					success(result) {
						nextPage($buttonContext.attr('redirect'));
					},
				});
			});
	}
	$('a[data-method="DELETE"]').on('click', linkDeleteHandler);

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	// Window Close
	$('.windowclose').on('click', () => {
		window.close();
	});

	// Window Print
	$('.windowprint').on('click', () => {
		window.print();
	});

	// Window History Back
	$('.historyback').on('click', () => {
		window.history.back();
	});

	// Window Local Storage Clear
	$('.localstorageclear').on('click', () => {
		localStorage.clear();
	});

	// Window Location Link
	$('.locationlink').on('click', function locationLink() {
		nextPage($(this).attr('data-loclink'), !!$(this).attr('data-blank'));
	});

	// Print Button
	document.querySelectorAll('.print .btn-print').forEach((btn) => {
		btn.addEventListener('click', (evt) => printPart(evt));
		btn.addEventListener('keyup', (evt) => {
			if (evt.keyCode === 13) {
				printPart(evt);
			}
		});
	});

	// from: https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
	function isMobileDevice() {
		return (
			typeof window.orientation !== 'undefined'
			|| navigator.userAgent.indexOf('IEMobile') !== -1
		);
	}

	$('.embed-pdf .single-pdf a').click((e) => {
		const elem = e.target;
		const pdf = $(elem)
			.parents('a[href]')
			.attr('href');
		let opened = true;
		// TODO: perhaps check if file exists and status==200
		if (pdf && pdf.endsWith('.pdf')) {
			if (isMobileDevice()) {
				return true;
			}
			e.preventDefault();

			// TODO: for better reusability, create hbs and render instead of inline
			const viewerHtml = `<object class="viewer" data="${
				pdf
			}" type="application/pdf" >\n`
				+ `<iframe src="${
					pdf
				}" style="width:100%; height:700px; border: none;">\n`
				+ `<p>${$t('about.text.browserNotSupported')} <a href="${
					pdf
				}" target="_blank" rel="noopener">GEI-Broschuere-web.pdf</a>.</p>\n`
				+ '</iframe>\n'
				+ '</object>';

			const thisrow = $(elem).parents('.embed-pdf-row');
			const page = $(elem)
				.parents('.container.embed-pdf')
				.parent();
			if (thisrow.find('.viewer:visible').length > 0) {
				// viewer opened in this row, rewrite pdf source
				if (thisrow.find('.viewer').attr('data') === pdf) {
					// same document, close
					thisrow.find('.viewer:visible').remove();
					opened = false;
				}
				thisrow.find('.viewer').attr('data', pdf);
				page.find('.opened').removeClass('opened');
			} else if (page.find('.viewer:visible').length > 0) {
				// if viewer is opened in another row
				page.find('.viewer:visible').remove();
				thisrow.append(viewerHtml);
			} else {
				// no viewer is opened
				thisrow.append(viewerHtml);
			}
			if (opened) {
				$(elem)
					.parents('.single-pdf')
					.addClass('opened');
			} else {
				$(elem)
					.parents('.single-pdf')
					.removeClass('opened');
			}
		}
		return false;
	});
	$('.chosen-container-multi').off('touchstart');
	$('.chosen-container-multi').off('touchend');
});

/* Mail Validation
official firefox regex https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
*/
window.addEventListener('DOMContentLoaded', () => {
	document
		.querySelectorAll('input[type="email"]:not([pattern])')
		.forEach((input) => {
			input.setAttribute(
				'pattern',
				// eslint-disable-next-line max-len
				"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
			);
		});
});
