import './pwd.js';
import { validatePassword, validateConfirmationPassword } from './helpers/passwordValidations';
import validateInputOnOpeningTag from './helpers/openingTagValidation';


$(document).ready(function() {
    var $deleteModal = $('.delete-modal');

    const password = document.getElementById("passwordNew")
    const confirm_password = document.getElementById("password_control");

    if (password) password.addEventListener('keyup', () => validatePassword(password));
    if (confirm_password) confirm_password.addEventListener('keyup', () => validateConfirmationPassword(password, confirm_password));

    const firstName = document.getElementsByName('firstName')[0];
    if (firstName) firstName.addEventListener('keyup', () => validateInputOnOpeningTag(firstName));

    const lastName = document.getElementsByName('lastName')[0];
    if (lastName) lastName.addEventListener('keyup', () => validateInputOnOpeningTag(lastName));

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
});
