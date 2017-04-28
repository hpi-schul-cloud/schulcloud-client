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

$(document).ready(function(){
    // notification stuff
    var $notification = $('.notification');
    var $notificationContent = $notification.find('.notification-content');

    window.$.showNotification = function(content, type, timeout) {
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

    window.$.hideNotification = function() {
        $notification.fadeOut();
    };

    $notification.find('.close').click(window.$.hideNotification);


    // Initialize bootstrap-select
    $('select').not('.no-bootstrap').chosen({
        width: "100%",
        "disable_search": true
    });


    // Init mobile nav
    $('.mobile-nav-toggle').click(function(e) {
        $('aside.nav-sidebar nav:first-child').toggleClass('active');
    });

    $('.mobile-search-toggle').click(function(e) {
        $('.search-wrapper .input-group').toggleClass('active');
        $('.search-wrapper .mobile-search-toggle .fa').toggleClass('fa-search').toggleClass('fa-times');
    });
});