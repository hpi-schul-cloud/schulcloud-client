/**
 * HELPER - addEventListener
 * 1. allow multiple events "clicked input" ...
 * 2. define addEventListener on NodeLists (document.querySelectorAll)
 */
if (!NodeList.prototype.addEventListener) {
    NodeList.prototype.addEventListener = function(events, callback, useCapture) {
        this.forEach((entry)=>{
            events.split(" ").forEach((event)=>{
                entry.addEventListener(event, callback, useCapture);
            });
        });
        return this;
    };
}

const nativeEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(events, callback, useCapture) {
    this.nativeListener = nativeEventListener;
    events.split(" ").forEach((event)=>{
        this.nativeListener(event, callback, useCapture);
    });
    return this;
};

function populateModal(modal, identifier, data) {
    const block = modal.find(identifier);
    block.html(data);
}

function populateModalForm(modal, data) {

    var $title = modal.find('.modal-title');
    var $btnSubmit = modal.find('.btn-submit');
    var $btnClose = modal.find('.btn-close');
    var $form = modal.find('.modal-form');

    $title.html(data.title);
    $btnSubmit.html(data.submitLabel);
    $btnClose.html(data.closeLabel);

    if (data.action) {
        $form.attr('action', data.action);
    }

    if (data.payload) {
        $form.attr('data-payload', JSON.stringify(data.payload));
    }

    // fields
    $('[name]', $form).not('[data-force-value]').each(function () {
        var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
        switch ($(this).prop("type")) {
            case "radio":
            case "checkbox":
                $(this).each(function () {
                    if (($(this).attr('name') == $(this).prop('name')) && value) {
                        $(this).attr("checked", value);
                    } else {
                        $(this).removeAttr("checked");
                    }
                });
                break;
            case "datetime-local":
                $(this).val(value.slice(0, 16)).trigger("chosen:updated");
                break;
            case "date":
                $(this).val(value.slice(0, 10)).trigger("chosen:updated");
                break;
            case "color":
                $(this).attr("value", value);
                $(this).attr("placeholder", value);
                break;
            default:
                if ($(this).prop('nodeName') == "TEXTAREA" && $(this).hasClass("customckeditor")) {
                    if (CKEDITOR.instances.description) {
                        CKEDITOR.instances.description.setData(value);
                    }
                } else {
                    $(this).val(value).trigger("chosen:updated");
                }
        }
    });
}

function printPart(){
    $(this).hide();
    w = window.open();
    w.document.write($(this).parent(".print").html());
    w.print();
    w.close();
    $(this).show();
}

var originalReady = jQuery.fn.ready;
$.fn.extend({
    ready: function(handler) {
        $(document).on("pageload", handler);
    }
});
$( window ).on( "load", function () {
    $(document).trigger("pageload");
})
$(document).ready(function () {
    // Bootstrap Tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // notification stuff
    var $notification = $('.notification');
    var $notificationContent = $notification.find('.notification-content');

    window.$.showNotification = function (content, type, timeout) {
        $notificationContent.html(content);

        // remove old classes in case type was set before
        $notification.removeClass();
        $notification.addClass('notification alert alert-fixed alert-' + (type || 'info'));

        $notification.fadeIn();

        if (timeout) {
            setTimeout(function () {
                $notification.fadeOut();
            }, (Number.isInteger(timeout)?timeout:5000));
        }
    };

    window.$.hideNotification = function () {
        $notification.fadeOut();
    };

    $notification.find('.close').click(window.$.hideNotification);


    // Initialize bootstrap-select
    $('select:not(.no-bootstrap):not(.search-enabled)').chosen({
        width: "100%",
        "disable_search": true
    }).change(function() {
        this.dispatchEvent(new Event('input'));
    });
    $('select.search-enabled:not(.no-bootstrap)').chosen({
        width: "100%",
        "disable_search": false
    }).change(function() {
        this.dispatchEvent(new Event('input'));
    });

    // collapse toggle
    $('.collapse-toggle').click(function (e) {
        var $collapseToggle = $(this);
        var isCollapsed = $($collapseToggle.attr("href")).attr("aria-expanded");
        if (!isCollapsed || isCollapsed === 'false') {
            $collapseToggle.find('.collapse-icon').removeClass("fa-chevron-right");
            $collapseToggle.find('.collapse-icon').addClass("fa-chevron-down");
        } else {
            $collapseToggle.find('.collapse-icon').removeClass("fa-chevron-down");
            $collapseToggle.find('.collapse-icon').addClass("fa-chevron-right");
        }
    });

    (function (a, b, c) {
        if (c in b && b[c]) {
            var d, e = a.location, f = /^(a|html)$/i;
            a.addEventListener("click", function (a) {
                d = a.target;
                while (!f.test(d.nodeName))d = d.parentNode;
                "href" in d && (d.href.indexOf("http") || ~d.href.indexOf(e.host)) && (a.preventDefault(), e.href = d.href)
            }, !1)
        }
    })(document, window.navigator, "standalone");


    // delete modals
    var $modals = $('.modal');
    var $deleteModal = $('.delete-modal');

    const nextPage = function(href) {
        if(href){
            window.location.href = href;
        }else{
            window.location.reload();
        }
    };

    function showAJAXError(req, textStatus, errorThrown) {
        $deleteModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn", 30000);
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    $('a[data-method="DELETE"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('name') + "' löschen möchtest?");
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                error: showAJAXError,
                success: function(result) {
                    nextPage($buttonContext.attr('redirect'));
                },
            });
        });
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

    // Print Button
    document.querySelectorAll('.print .btn-print').forEach(btn => {
        btn.addEventListener("click", printPart);
    });

    if (document.querySelector("*[data-intro]") && screen.width > 1024) {
        document.querySelectorAll(".intro-trigger").forEach((trigger)=>{
            trigger.classList.add("show");
        });
    };

    // from: https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
    function isMobileDevice() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    };

    $(".embed-pdf .single-pdf").click(e => {
        e.preventDefault();
        var elem = e.target;
        var pdf = $(elem).parents(".single-pdf").attr("data-pdf");
        var opened = true;
        //TODO: perhaps check if file exists and status==200
        if(pdf&&pdf.endsWith(".pdf")) {
            if (isMobileDevice()) {
                window.open(window.location.origin+pdf, '_blank', 'fullscreen=yes');
                return false;
            } else {
                //TODO: for better reusability, create hbs and render instead of inline
                var viewerHtml = '<object class="viewer" data="'+pdf+'" type="application/pdf" >\n' +
                    '<iframe src="'+pdf+'" style="width:100%; height:700px; border: none;">\n' +
                    '<p>Ihr Browser kann das eingebettete PDF nicht anzeigen. Sie können es sich hier ansehen: <a href="'+pdf+'" target="_blank" rel="noopener">GEI-Broschuere-web.pdf</a>.</p>\n' +
                    '</iframe>\n' +
                    '</object>';

                var thisrow = $(elem).parents(".embed-pdf-row");
                var page = $(elem).parents(".container.embed-pdf").parent();
                if(thisrow.find(".viewer:visible").length>0) {
                    // viewer opened in this row, rewrite pdf source
                    if(thisrow.find(".viewer").attr("data")===pdf) {
                        // same document, close
                        thisrow.find(".viewer:visible").remove();
                        opened = false;
                    }
                    thisrow.find(".viewer").attr("data", pdf);
                    page.find(".opened").removeClass("opened");
                } else if (page.find(".viewer:visible").length>0) {
                    // if viewer is opened in another row
                    page.find(".viewer:visible").remove();
                    thisrow.append(viewerHtml);
                } else {
                    // no viewer is opened
                    thisrow.append(viewerHtml);
                }
                if (opened) {
                    $(elem).parents(".single-pdf").addClass("opened");
                } else {
                    $(elem).parents(".single-pdf").removeClass("opened");
                }
            }
        }
    });

    $(".chosen-container-multi").off( "touchstart");
    $(".chosen-container-multi").off( "touchend");
});


/* Mail Validation
official firefox regex https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
*/
window.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('input[type="email"]:not([pattern])').forEach((input) => {
        input.setAttribute('pattern', "^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
    });
});
