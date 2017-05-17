function getQueryParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=[^&#]*", "i");
    if (re.test(uri)) {
        return uri.replace(re, '$1' + key + "=" + value);
    } else {
        var matchData = uri.match(/^([^#]*)(#.*)?$/);
        var separator = /\?/.test(uri) ? "&" : "?";
        return matchData[0] + separator + key + "=" + value + (matchData[1] || '');
    }
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

$(document).ready(function () {
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
            }, 5000);
        }
    };

    window.$.hideNotification = function () {
        $notification.fadeOut();
    };

    $notification.find('.close').click(window.$.hideNotification);


    // Initialize bootstrap-select
    $('select').not('.no-bootstrap').chosen({
        width: "100%",
        "disable_search": true
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


    // Init mobile nav
    $('.mobile-nav-toggle').click(function (e) {
        $('aside.nav-sidebar nav:first-child').toggleClass('active');
    });

    $('.mobile-search-toggle').click(function (e) {
        $('.search-wrapper .input-group').toggleClass('active');
        $('.search-wrapper .mobile-search-toggle .fa').toggleClass('fa-search').toggleClass('fa-times');
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

});
