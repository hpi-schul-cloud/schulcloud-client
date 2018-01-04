$(document).ready(function() {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');

    $('.btn-add').on('click', function(e) {
        e.preventDefault();
        $.getJSON('/classes/currentTeacher/', function (teacher) {
            populateModalForm($addModal, {
                title: 'Klasse hinzufügen',
                closeLabel: 'Abbrechen',
                submitLabel: 'Hinzufügen',
                fields: {teacherIds: [teacher]}
            });
            $addModal.modal('show');
        });
    });

    $('.btn-edit').on('click', function(e){
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function(result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Klasse bearbeiten',
                closeLabel: 'Abbrechen',
                submitLabel: 'Speichern',
                fields: result
            });
            $editModal.modal('show');
        });
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });
});