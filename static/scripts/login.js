/* global introJs */
$(document).ready(function() {

	// reset localStorage when new version is Published
	const newVersion = 1;
	const currentVersion = parseInt(localStorage.getItem('homepageVersion') || '0', 10);

	if(currentVersion < newVersion){
		localStorage.clear();
		localStorage.setItem('homepageVersion', newVersion.toString());
	}

	try {
		console.log(`
	__  __  ____    ______      _____           __               ___            _____   ___                       __
   /\\ \\/\\ \\/\\  _\`\\ /\\__  _\\    /\\  __\`\\        /\\ \\             /\\_ \\          /\\  __\`\\/\\_ \\                     /\\ \\
   \\ \\ \\_\\ \\ \\ \\_\\ \\/_/\\ \\/    \\ \\,\\_\\_\\    ___\\ \\ \\___   __  __\\//\\ \\         \\ \\ \\/\\_\\//\\ \\     ___   __  __   \\_\\ \\
	\\ \\  _  \\ \\ ,__/  \\ \\ \\     \\/_\\___ \\  /'___\\ \\  _ \`\\/\\ \\/\\ \\ \\ \\ \\   ______\\ \\ \\/_/_\\ \\ \\   / __\`\\/\\ \\/\\ \\  /'_\` \\
	 \\ \\ \\ \\ \\ \\ \\/    \\_\\ \\__    /\\ \\_\\ \\/\\ \\__/\\ \\ \\ \\ \\ \\ \\_\\ \\ \\_\\ \\_/\\_____\\\\ \\ \\_\\ \\\\_\\ \\_/\\ \\_\\ \\ \\ \\_\\ \\/\\ \\_\\ \\
	  \\ \\_\\ \\_\\ \\_\\    /\\_____\\   \\ \`\\____\\ \\____\\\\ \\_\\ \\_\\ \\____/ /\\____\\/_____/ \\ \\____//\\____\\ \\____/\\ \\____/\\ \\___,_\\
	   \\/_/\\/_/\\/_/    \\/_____/    \\/_____/\\/____/ \\/_/\\/_/\\/___/  \\/____/         \\/___/ \\/____/\\/___/  \\/___/  \\/__,_ /
	`);
		console.log("Mit Node, React und Feathers verknüpfst du eher die Sprache Javascript als Englisch? Du suchst ein junges Team, lockere Atmosphäre und flache Hierarchien? Dann schau dir unsere Stellen an: https://schul-cloud.org/community#jobs");
	} catch(e) {
		// no log
	}

    var $btnToggleProviers = $('.btn-toggle-providers');
    var $btnHideProviers = $('.btn-hide-providers');
    var $btnLogin = $('.btn-login');
    var $loginProviders = $('.login-providers');
    var $school = $('.school');
    var $systems = $('.system');
    var $modals = $('.modal');
    var $pwRecoveryModal = $('.pwrecovery-modal');
    var $submitButton = $('#submit-login');

    var incTimer = function(){
        setTimeout (function(){
            if(countdownNum != 1){
                countdownNum--;
                $submitButton.val('Bitte ' + countdownNum + ' Sekunden warten');
                incTimer();
            } else {
                $submitButton.val('Anmelden');
            }
        },1000);
    };

    if($submitButton.data('timeout')){
        setTimeout (function(){
            $submitButton.prop('disabled', false);
        },$submitButton.data('timeout')*1000);

        var countdownNum = $submitButton.data('timeout');
        incTimer();
    }

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
		const school = $school.val();
		const system = $systems.val();
		if(school){
			localStorage.setItem('loginSchool', school);
		}
		if(system){
			localStorage.setItem('loginSystem', system);
		}
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
        skipLabel: "Überspringen",
        hidePrev: true, //hide previous button in the first step
        hideNext: true  //hide next button in the last step
    })
    .start()
    .oncomplete(function() {
        localStorage.setItem('Tutorial', true);
        document.querySelector("#demologin").click();
    });
};

if ('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            if(registration.active && registration.active.scriptURL.endsWith('/sw.js')){
                registration.unregister();
                caches.keys().then(function(cacheNames) {
                    return Promise.all(
                      cacheNames.filter(function(cacheName) {
                        return cacheName.startsWith('workbox') | cacheName.startsWith('images')
                        | cacheName.startsWith('pages') | cacheName.startsWith('vendors');
                      }).map(function(cacheName) {
                        return caches.delete(cacheName);
                      })
                    );
                });
            }
        }
    });
}
