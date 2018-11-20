/* global introJs */
$(document).ready(function() {
    var $btnToggleProviers = $('.btn-toggle-providers');
    var $btnHideProviers = $('.btn-hide-providers');
    var $btnLogin = $('.btn-login');
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
                let selected;
                if(localStorage.getItem('loginSystem') == system._id) {
                    selected = true;
                }
                $systems.append('<option ' + (selected ? 'selected': '') + ' value="' + system._id + '">' + system.type + systemAlias + '</option>');
            });
            $systems.trigger('chosen:updated');
            systems.length == 1 ? $systems.parent().hide() : $systems.parent().show();
        });
    };

    $btnToggleProviers.on('click', function(e) {
        e.preventDefault();
        $btnToggleProviers.hide();
        $loginProviders.show();
    });

    $btnHideProviers.on('click', function(e) {
        e.preventDefault();
        $btnToggleProviers.show();
        $loginProviders.hide();
        $school.val('');
        $school.trigger('chosen:updated');
        $systems.val('');
        $systems.trigger('chosen:updated');
    });

    $btnLogin.on('click', function(e) {
        localStorage.setItem('loginSchool', $school.val());
        localStorage.setItem('loginSystem', $systems.val());
    });

    $school.on('change', function() {
        const id = $(this).val();
        loadSystems( id );
        $school.find("option").not("[value='"+id+"']").removeAttr('selected');
        $school.find("option[value='"+id+"']").attr('selected',true);
        $school.trigger('chosen:updated');
    });

    $('.submit-pwrecovery').on('click', function(e) {
        e.preventDefault();
        populateModalForm($pwRecoveryModal, {
            title: 'Passwort Zurücksetzen',
            closeLabel: 'Abbrechen',
            submitLabel: 'Abschicken'
        });
        $pwRecoveryModal.appendTo('body').modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

    // if stored login system - use that
    if(localStorage.getItem('loginSchool')) {
        $btnToggleProviers.hide();
        $loginProviders.show();
        $school.val(localStorage.getItem('loginSchool'));
        $school.trigger('chosen:updated');
        $school.trigger('change');
    }

});

window.startIntro = function startIntro() {
    introJs()
    .setOptions({
        nextLabel: "Weiter",
        prevLabel: "Zurück",
        doneLabel: "Nächste Seite",
        skipLabel: "Überspringen"
    })
    .start()
    .oncomplete(function() {
        localStorage.setItem('Tutorial', true);
        document.querySelector("#loginarea > div > div > form:nth-child(3) > div > input").click();
    });
};
