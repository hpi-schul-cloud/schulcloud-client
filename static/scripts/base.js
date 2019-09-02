/**
 * HELPER - addEventListener
 * 1. allow multiple events "clicked input" ...
 * 2. define addEventListener on NodeLists (document.querySelectorAll)
 */
if (!NodeList.prototype.addEventListener) {
	NodeList.prototype.addEventListener = function (
		events,
		callback,
		useCapture,
	) {
		this.forEach((entry) => {
			events.split(' ').forEach((event) => {
				entry.addEventListener(event, callback, useCapture);
			});
		});
		return this;
	};
}

const nativeEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (
	events,
	callback,
	useCapture,
) {
	this.nativeListener = nativeEventListener;
	events.split(' ').forEach((event) => {
		this.nativeListener(event, callback, useCapture);
	});
	return this;
};

function populateModal(modal, identifier, data) {
	const block = modal.find(identifier);
	block.html(data);
}

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

	// fields
	$('[name]', $form)
		.not('[data-force-value]')
		.each(function () {
			const value =				(data.fields || {})[
				$(this)
					.prop('name')
					.replace('[]', '')
			] || '';
			switch ($(this).prop('type')) {
				case 'radio':
				case 'checkbox':
					$(this).each(function () {
						if (
							$(this).attr('name') == $(this).prop('name')
							&& value
						) {
							$(this).attr('checked', value);
						} else {
							$(this).removeAttr('checked');
						}
					});
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
						$(this).prop('nodeName') == 'TEXTAREA'
						&& $(this).hasClass('customckeditor')
					) {
						if (CKEDITOR.instances.description) {
							CKEDITOR.instances.description.setData(value);
						}
					} else {
						$(this)
							.val(value)
							.trigger('chosen:updated');
					}
			}
		});
}

function printPart() {
	$(this).hide();
	w = window.open();
	w.document.write(
		$(this)
			.parent('.print')
			.html(),
	);
	w.print();
	w.close();
	$(this).show();
}

const originalReady = jQuery.fn.ready;
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

	window.$.showNotification = function (content, type, timeout) {
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

	window.$.hideNotification = function () {
		$notification.fadeOut();
	};

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
	$('select:not(.no-bootstrap):not(.search-enabled)')
		.chosen({
			width: '100%',
			disable_search: true,
		})
		.change(function () {
			this.dispatchEvent(new Event('input'));
		});
	$('select.search-enabled:not(.no-bootstrap)')
		.chosen({
			width: '100%',
			disable_search: false,
		})
		.change(function () {
			this.dispatchEvent(new Event('input'));
		});

	// collapse toggle
	$('.collapse-toggle').click(function (e) {
		const $collapseToggle = $(this);
		const isCollapsed = $($collapseToggle.attr('href')).attr('aria-expanded');
		if (!isCollapsed || isCollapsed === 'false') {
			$collapseToggle
				.find('.collapse-icon')
				.removeClass('fa-chevron-right');
			$collapseToggle.find('.collapse-icon').addClass('fa-chevron-down');
		} else {
			$collapseToggle
				.find('.collapse-icon')
				.removeClass('fa-chevron-down');
			$collapseToggle.find('.collapse-icon').addClass('fa-chevron-right');
		}
	});

	(function (a, b, c) {
		if (c in b && b[c]) {
			let d;
			const e = a.location;
			const f = /^(a|html)$/i;
			a.addEventListener(
				'click',
				(a) => {
					d = a.target;
					while (!f.test(d.nodeName)) d = d.parentNode;
					'href' in d
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

	const nextPage = function (href) {
		if (href) {
			window.location.href = href;
		} else {
			window.location.reload();
		}
	};

	function showAJAXError(req, textStatus, errorThrown) {
		$deleteModal.modal('hide');
		if (textStatus === 'timeout') {
			$.showNotification('Zeitüberschreitung der Anfrage', 'warn', 30000);
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

	$('a[data-method="DELETE"]').on('click', function (e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				`Bist du dir sicher, dass du '${
					decodingHelper($buttonContext.data('name'))
				}' löschen möchtest?`,
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
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	// Print Button
	document.querySelectorAll('.print .btn-print').forEach((btn) => {
		btn.addEventListener('click', printPart);
	});

	if (document.querySelector('*[data-intro]') && screen.width > 1024) {
		document.querySelectorAll('.intro-trigger').forEach((trigger) => {
			trigger.classList.add('show');
		});
	}

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
				+ `<p>Ihr Browser kann das eingebettete PDF nicht anzeigen. Sie können es sich hier ansehen: <a href="${
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
				"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
			);
		});
});
