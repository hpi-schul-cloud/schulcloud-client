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

    var populateModalForm = function(modal, data) {

        var $title = modal.find('.modal-title');
        var $btnSubmit = modal.find('.btn-submit');
        var $btnClose = modal.find('.btn-close');
        var $form = modal.find('.modal-form');

        $title.html(data.title);
        $btnSubmit.html(data.submitLabel);
        $btnClose.html(data.closeLabel);

        if(data.action) {
            console.log(data.action);
            $form.attr('action', data.action);
        }

        // fields
        $('[name]', $form).not('[data-force-value]').each(function () {
            var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
            switch ($(this).prop("type")) {
                case "radio":
                    if(typeof(value) === "boolean"){value = value?"1":"0";}
                    if(value === ""){value = "0";}
                    if (($(this).attr('name') == $(this).prop('name'))&&($(this).attr('value')==value)){
                        $(this).attr("checked","checked");
                    }else{
                        $(this).removeAttr("checked");
                    }
                    break;
                case "checkbox":
                    $(this).each(function () {
                        if (($(this).attr('name') == $(this).prop('name'))){
                            $(this).attr("checked", value);
                        }else{
                            $(this).removeAttr("checked");
                        }
                    });
                    break;
                case "color":
                    $(this).attr("value", value);
                    $(this).attr("placeholder", value);
                    break;
                default:
                    $(this).val(value).trigger("chosen:updated");
            }
        });
    };


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