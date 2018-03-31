if (window.opener && window.opener !== window) {
    document.body.classList.add('window-inline');
    window.isInline = true;
}

$(document).ready(function () {
    $('.btn-poll').on('click', function (e) {
        e.preventDefault();

        document.cookie = "pollClicked=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
    });
});
