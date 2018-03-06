$(document).ready(function () {
    var $modals = $('.modal');
    var $pollModal = $('.poll-modal');

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    populateModalForm($pollModal, {
        title: 'Befragung I im Projekt Schul-Cloud',
        closeLabel: 'Abbrechen'
    });

    let cookies = getCookiesMap(document.cookie);

    if (!cookies['pollClicked'])
        $pollModal.modal('show');

    $('.btn-poll').on('click', function (e) {
        e.preventDefault();

        document.cookie = "pollClicked=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        window.open('https://tools.openhpi.de/survey/index.php?r=survey/index&sid=137936&newtest=Y&lang=de', '_target');
        $pollModal.modal('hide');
    });
});
