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
            fields: {firstName: $('input[name="displayName"]').val()}
        });
        $deleteModal.appendTo('body').modal('show');
    });
});