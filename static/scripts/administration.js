$(document).ready(function() {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');

    $('.btn-add').on('click', function(e) {
        e.preventDefault();
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Hinzufügen'
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function(e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function(result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Bearbeiten',
                closeLabel: 'Schließen',
                submitLabel: 'Speichern',
                fields: result
            });

            populateCourseTimes($editModal, result.times || []);
            $editModal.modal('show');
        });
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

});