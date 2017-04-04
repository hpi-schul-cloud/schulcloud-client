$(document).ready(function() {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');


    var populateModalForm = function(modal, data) {

        var $title = modal.find('.modal-title');
        var $btnSubmit = modal.find('.btn-submit');
        var $btnClose = modal.find('.btn-close');
        var $form = modal.find('.modal-form');

        $title.html(data.title);
        $btnSubmit.html(data.submitLabel);
        $btnClose.html(data.closeLabel);

        if(data.action) {
            $form.attr('action', data.action);
        }

        // fields
        $('[name]', $form).not('[data-force-value]').each(function () {
            var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
            switch ($(this).prop("type")) {
                case "radio":
                case "checkbox":
                    $(this).each(function () {
                        if (($(this).attr('name') == $(this).prop('name'))&&value){
							$(this).attr("checked", value);
						}else{
							$(this).removeAttr("checked");
						}
                    });
                    break;
				case "datetime-local":
					$(this).val(value.slice(0,16)).trigger("chosen:updated");
					break;
				case "date":
					$(this).val(value.slice(0,10)).trigger("chosen:updated");
					break;
                default:
                    $(this).val(value).trigger("chosen:updated");
            }
        });
    };


    $('.btn-add').on('click', function(e) {
        e.preventDefault();
		// YYYY-MM-DDThh:mm
		var now = new Date;
		var dd = (now.getDate()<10)?"0"+now.getDate():now.getDate();
		var mm = (now.getMonth()<10)?"0"+now.getMonth():now.getMonth();
		var availableDate = now.getFullYear()+"-"+mm+"-"+dd+"T"+now.getHours()+":"+now.getMinutes();
		var dueDate = (now.getFullYear()+9)+"-"+mm+"-"+dd+"T"+now.getHours()+":"+now.getMinutes(); //default dueDate: now + 9 years
		var result = JSON.parse('{"availableDate":"'+availableDate+'", "dueDate":"'+dueDate+'"}');
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Hinzufügen',
			fields: result
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function(e) {
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

});