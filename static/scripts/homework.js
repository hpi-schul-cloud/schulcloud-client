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
        const submissionid = this.getAttribute("data");
        this.disabled = true;
        this.innerHTML = 'importiere <style>.loadingspinner>div{background-color:#000;}</style><div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
        if(confirm("Möchten Sie wirklich Ihre Bewertung durch die Abgabe des Schülers ersetzen?")){
            $.ajax({
                url: "/homework/submit/"+submissionid+"/import",
                context: this
            }).done(function(r) {
                CKEDITOR.instances["evaluation "+submissionid].setData( r.comment );
                this.disabled = false;
                this.innerHTML = "Abgabe des Schülers importieren";
            });
        }
    });
});