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

function printPart(){
    $(this).hide();
    w = window.open();
    w.document.write($(this).parent(".print").html());
    w.print();
    w.close();
    $(this).show();
}

function toggleMobileNav(){
    document.querySelector('aside.nav-sidebar nav:first-child').classList.toggle('active');
    this.classList.toggle('active');
}
function toggleMobileSearch(){
    document.querySelector('.search-wrapper .input-group').classList.toggle('active');
    document.querySelector('.search-wrapper .mobile-search-toggle .fa').classList.toggle('fa-search');
    document.querySelector('.search-wrapper .mobile-search-toggle .fa').classList.toggle('fa-times');
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

    $('a[data-method="delete-material"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.modal('show');
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

    $deleteModal.find('.close, .btn-close').on('click', function() {
        $deleteModal.modal('hide');
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
    
    $(".embed-pdf .single-pdf").click(e => {
        e.preventDefault();
        var elem = e.target;
        var pdf = $(elem).parents(".single-pdf").attr("data-pdf");
        //TODO: perhaps check if file exists and status==200
        if(pdf&&pdf.endsWith(".pdf")) {
            //TODO: for better reusability, create hbs and render instead of inline
            var viewerHtml = '<object class="viewer" data="'+pdf+'" type="application/pdf" style="width:100%; height:700px;" >\n' +
                '<iframe src="'+pdf+'" style="width:100%; height:700px; border: none;">\n' +
                '<p>Ihr Browser kann das eingebettete PDF nicht anzeigen. Sie können es sich hier ansehen: <a href="'+pdf+'" target="_blank" rel="noopener">GEI-Broschuere-web.pdf</a>.</p>\n' +
                '</iframe>\n' +
                '</object>';
            var thisrow = $(elem).parents(".embed-pdf-row");
            var page = $(elem).parents(".container.embed-pdf").parent();
            if(thisrow.find(".viewer:visible").length>0) {
                // viewer opened in this row, rewrite pdf source
                thisrow.find(".viewer").attr("data", pdf);
            } else if (page.find(".viewer:visible").length>0) {
                // if viewer is opened in another row
                page.find(".viewer:visible").remove();
                thisrow.append(viewerHtml);
            } else {
                // no viewer is opened
                thisrow.append(viewerHtml);
            }
        }
    });

    $(".chosen-container-multi").off( "touchstart");
    $(".chosen-container-multi").off( "touchend");
});