$(document).ready(function() {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');

    $('.btn-add').on('click', function(e) {
        e.preventDefault();
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Hinzufügen',
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function(e){
        e.preventDefault();
		var entry = $(this).attr('href');
		$.getJSON(entry, function(result) {
			if((!result.courseId)||(result.courseId && result.courseId.length<=2)){result.private = true;}
			populateModalForm($editModal, {
				action: entry,
				title: 'Bearbeiten',
				closeLabel: 'Schließen',
				submitLabel: 'Speichern',
				fields: result
			});
			$editModal.modal('show');
        });
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

    $('#sortselection').on('change', function(e){
        window.location = window.location.pathname + "?sort=" + escape( $('#sortselection').val());
    });
    
    $('.importsubmission').on('click', function(e){
        e.preventDefault();
    });
});