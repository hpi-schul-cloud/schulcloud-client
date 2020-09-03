import './pwd.js';

$(document).ready(function() {
    var $deleteModal = $('.delete-modal');

    var password = document.getElementById("passwordNew")
        , confirm_password = document.getElementById("password_control");

    function validatePassword(){
        if(password.value != confirm_password.value) {
            confirm_password.setCustomValidity($t('global.text.passwordsAreDifferent'));
        } else {
            confirm_password.setCustomValidity('');
        }
    }

    if (password) password.onchange = validatePassword;
    if (confirm_password) confirm_password.onkeyup = validatePassword;

    // TODO: replace with something cooler
    var reloadSite = function() {
        delete_cookie("notificationPermission");
        window.location.reload();
    };

    $('a[data-method="delete"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text($t('global.text.sureAboutDeleting', { name: $buttonContext.data('device-name') }));

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

    $('button[data-method="requestpermission"]').on('click', function() {
		pushManager.requestPermission();
	});

    function delete_cookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    $(".send-test-notification").on('click', function () {
        $.post('/notification/message', {
            "title": $t('account.testNotification.headline.test'),
            "body": $t('account.testNotification.text.youHaveANewMessage'),
            "action": document.location.origin + '/dashboard/',
            "token": $("[name='userId']").val(),
            "scopeIds": [
                $("[name='userId']").val()
            ]
        });
    });

});
