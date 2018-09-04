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
window.addEventListener('DOMContentLoaded', () => {
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
            role = "student",
            reglink = "",
            schoolId = $invitationModal.find("input[name='schoolId']").val(),
            email = $('input[name="email"]').val();
        if ($(this).hasClass("teacher")) role = "teacher";
        console.log(email);
        // get registration link
        $.ajax({
            type: "POST",
            url: "/registrationlink/",
            async: false,
            data: {
                toHash: email,
                save: true,
                patchUser: true,
                role: role,
                schoolId: schoolId
            },
            success: function(data) {
                console.log("user_edit.js registrationlink data");
                console.log(data);
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: {invitation: data}
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