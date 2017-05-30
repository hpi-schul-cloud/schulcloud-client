$(document).ready(function () {
    $('.btn-hidden-toggle').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $hiddenToggleIcon = $(this).find('.fa');
        $.ajax({
            method: 'PATCH',
            url: window.location.href + '/topics/' + $(this).attr('href') + '?json=true',
            data: {hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash')},
            success: function(result) {
                if (result.hidden) {
                    $hiddenToggleIcon.addClass('fa-eye-slash');
                    $hiddenToggleIcon.removeClass('fa-eye');
                } else {
                    $hiddenToggleIcon.removeClass('fa-eye-slash');
                    $hiddenToggleIcon.addClass('fa-eye');
                }
            }
        });
    });

    $('#geo-gebra-info').tooltip({
        placement: 'top',
        title: "Die Material-ID finden Sie in der URL zu dem GeoGebra-Arbeitsblatt, was sie online abgespeichert haben. Bei z.B. https://www.geogebra.org/m/e6g4adXp ist die Material-ID 'e6g4adXp' "
    })
});
