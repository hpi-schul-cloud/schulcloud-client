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

    function getSearchParams(k){
        var p={};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(s,k,v){p[k]=v})
        return k?p[k]:p;
    }

    $('#desc').on('click', function(e){
        window.location.search = "?sort=" + escape($('#sortselection').val()) + "&desc=" + escape($('#desc').val());
    });

    $('#sortselection').on('change', function(e){
        window.location.search = "?sort=" + escape($('#sortselection').val()) + "&desc=" + escape(getSearchParams("desc"));
    });
});