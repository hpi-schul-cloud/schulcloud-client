$(document).ready(function () {
    var $modals = $('.modal');
    var $feedbackModal = $('.feedback-modal');
    var $modalForm = $('.modal-form');

    var populateModalForm = function (modal, data) {

        var $title = modal.find('.modal-title');
        var $btnSubmit = modal.find('.btn-submit');
        var $btnClose = modal.find('.btn-close');
        var $form = modal.find('.modal-form');

        $title.html(data.title);
        $btnSubmit.html(data.submitLabel);
        $btnClose.html(data.closeLabel);

        // fields
        $('[name]', $form).not('[data-force-value]').each(function () {
            var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
            switch ($(this).prop("type")) {
                case "radio":
                case "checkbox":
                    $(this).each(function () {
                        if ($(this).attr('value') == value) $(this).attr("checked", value);
                    });
                    break;
                default:
                    $(this).val(value).trigger("chosen:updated");
            }
        });
    };

    $('.submit-helpdesk').on('click', function (e) {
        e.preventDefault();
        $modalForm.attr('action', '/helpdesk');

        populateModalForm($feedbackModal, {
            title: 'Feedback',
            closeLabel: 'Schließen',
            submitLabel: 'Senden'
        });
        $feedbackModal.modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });
});