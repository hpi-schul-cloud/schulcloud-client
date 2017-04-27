$(document).ready(function() {
        $(function () {
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream){
                $('a').click(function () {
                    document.location = $(this).attr('href');
                    return false;
                });
            }});
});