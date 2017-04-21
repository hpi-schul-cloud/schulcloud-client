$(document).ready(function() {
        $(function () {
        $('a').click(function () {
            document.location = $(this).attr('href');
            return false;
        });
    });
});