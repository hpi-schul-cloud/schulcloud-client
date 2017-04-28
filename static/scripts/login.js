$(document).ready(function() {
    var $btnToggleProviers = $('.btn-toggle-providers');
    var $loginProviders = $('.login-providers');
    var $school = $('.school');
    var $systems = $('.system');

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
});