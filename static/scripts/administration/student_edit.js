import '../jquery/datetimepicker-easy';

function toggleConsentEditing(){
    document.getElementById('consents-overview').querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        if(input.getAttribute('disabled') !== undefined){
            input.removeAttribute('disabled');
        } else {
            input.setAttribute('disabled', 'disabled');
        };
    });
}
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('edit-consent').addEventListener('click', (event) => {
        toggleConsentEditing();
        event.target.classList.add('hidden');
    });
});


$(document).ready(function () {
    var $pwModal = $('.pw-modal');

    $('.btn-pw').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        populateModalForm($pwModal, {
            action: entry,
            title: 'Passwort ändern',
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: undefined
        });
        $pwModal.appendTo('body').modal('show');
    });
});