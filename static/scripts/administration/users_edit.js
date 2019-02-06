import '../jquery/datetimepicker-easy';
const moment = require('moment');

function toggleConsentEditing(){
    const birthdayInput = document.getElementById('birthday');
    let birthday, age;
    if(birthdayInput){
        let birthdaytext = birthdayInput.value.split('.');
        birthday = moment(`${birthdaytext[2]}-${birthdaytext[1]}-${birthdaytext[0]}`);
        age = moment().diff(birthday, 'years');
    }

    document.getElementById('consents-overview').querySelectorAll('input').forEach(input => {
        if(input.getAttribute('disabled') !== undefined){
            if (age && age >= 18){
                if((input.name).match('parent') == null){
                    input.removeAttribute('disabled');
                }
            } else {
                input.removeAttribute('disabled');
            }
        } else {
            input.setAttribute('disabled', 'disabled');
        }
    });
}
window.addEventListener('turbolinks:load', () => {
    document.getElementById('edit-consent').addEventListener('click', (event) => {
        toggleConsentEditing();
        event.target.classList.add('hidden');
    });
});


$(document).ready(function () {
    let $pwModal = $('.pw-modal');
    let $deleteModal = $('.delete-modal');

    $('.btn-pw').on('click', function (e) {
        e.preventDefault();
        populateModalForm($pwModal, {
            action: "pw",
            title: 'Passwort ändern',
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: undefined
        });
        $pwModal.appendTo('body').modal('show');
    });

    $('.btn-delete').on('click', function (e) {
        e.preventDefault();
        populateModalForm($deleteModal, {
            action: "",
            title: 'Benutzer löschen?',
            closeLabel: 'Abbrechen',
            submitLabel: 'Löschen',
            fields: {
                displayName: $('input[name="displayName"]').val()
            }
        });
        $deleteModal.appendTo('body').modal('show');
    });

    $('.btn-invitation-link-with-hash').on('click', function (e) {
        e.preventDefault();
        let $invitationModal = $('.invitation-modal'),
            schoolId = $invitationModal.find("input[name='schoolId']").val(),
            role = "student",
            email = $('input[name="email"]').val();
        if ($(this).hasClass("teacher")) role = "teacher";
        $.ajax({
            type: "POST",
            url: window.location.origin+"/administration/registrationlink",
            data: {
                role: role,
                save: true,
                schoolId: schoolId,
                host: window.location.origin,
                toHash: email,
                patchUser: true
            },
            success: function(linkData) {
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: {invitation: linkData.shortLink}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='invitation']").click(function () {
                    $(this).select();
                });

                $invitationModal.appendTo('body').modal('show');
            }
        });
    });
});
