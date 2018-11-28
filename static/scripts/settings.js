import { getCookiesMap, pushManager } from './notificationService/index';

$(document).ready(function() {
    var $deleteModal = $('.delete-modal');

    var password = document.getElementById("password_new")
        , confirm_password = document.getElementById("password_control");

    function validatePassword(){
        if(password.value != confirm_password.value) {
            confirm_password.setCustomValidity("Passwörter stimmen nicht überein.");
        } else {
            confirm_password.setCustomValidity('');
        }
    }

    password.onchange = validatePassword;
    confirm_password.onkeyup = validatePassword;

    // TODO: replace with something cooler
    var reloadSite = function() {
        delete_cookie("notificationPermission");
        window.location.reload();
    };

    var cookies = getCookiesMap(document.cookie);
    if (cookies["notificationPermission"])
        //$(".btn-device").prop("disabled", true); // todo alert when registration fails instead

    $('a[data-method="delete"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('device-name') + "' löschen möchtest?");

        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                data: {
                    name: $buttonContext.data('device-name'),
                    _id: $buttonContext.data('device-id')
                },
                success: function(result) {
                    reloadSite();
                }
            });
        });
    });

    function delete_cookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    $(".send-test-notification").on('click', function () {
        $.post('/notification/push', {
            "notification": {
                "title": "Neue Test-Benachrichtigung",
                "body": "Du hast eine neue Benachrichtigung"
            },
            "data": {
                "tag": "course-data-updated",
                "courseId": "0000dcfbfb5c7a3f00bf21ab",
            },
            "receivers": [
                $("[name='userId']").val()
            ],
            "template": "tpl",
            "languagePayloads": "lp"
        }, function(data){
            console.log('answer',data);
        });
    });

});
