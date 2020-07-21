$(document).ready(function () {
    var $modals = $('.modal');
    var $pollModal = $('.poll-modal');

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.feature-modal').modal('show');

    populateModalForm($pollModal, {
        title: $t('dashboard.headline.poll2Title'),
        closeLabel: $t('global.button.cancel')
    });

    let prefs = $('#preferences').html();

    let parsedPrefs = prefs === "" ? {} : JSON.parse($('#preferences').html());

    if (!parsedPrefs.pollSeen2)
		$pollModal.appendTo('body').modal('show');

    $('.btn-poll').on('click', function (e) {
        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "/account/preferences",
            data: { attribute: { key: "pollSeen2", value:true } }
        });

        window.open('https://tools.openhpi.de/survey/index.php?r=survey/index&sid=345643&newtest=Y&lang=de', '_target');
        $pollModal.modal('hide');
    });
});
