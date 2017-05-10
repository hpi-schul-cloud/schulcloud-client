$(document).ready(function() {
    var $btnToggleProviers = $('.btn-toggle-providers');
    var $loginProviders = $('.login-providers');
    var $school = $('.school');
    var $systems = $('.system');
    var $modals = $('.modal');
    var $pwRecoveryModal = $('.pwrecovery-modal');
    var $modalForm = $('.modal-form');

    var loadSystems = function(schoolId) {
        $systems.empty();
        $.getJSON('/login/systems/' + schoolId, function(systems) {
            systems.forEach(function(system) {
                var systemAlias = system.alias ? ' (' + system.alias + ')' : '';
                $systems.append('<option value="' + system._id + '">' + system.type + systemAlias + '</option>');
            });
            $systems.trigger('chosen:updated');
        });
    };

    $btnToggleProviers.on('click', function(e) {
        e.preventDefault();
        $btnToggleProviers.hide();
        $loginProviders.show();
    });

    $school.on('change', function() {
        loadSystems($school.val());
    });

    $('.submit-pwrecovery').on('click', function(e) {
        e.preventDefault();
        populateModalForm($pwRecoveryModal, {
            title: 'Passwort Zurücksetzen',
            closeLabel: 'Schließen',
            submitLabel: 'Abschicken'
        });
        $pwRecoveryModal.modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });
});