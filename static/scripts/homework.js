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

    function ajaxForm(element, after){
        const submitButton = element.find('[type=submit]')[0];
        let submitButtonText = submitButton.innerHTML || submitButton.value;
        submitButton.innerHTML = submitButtonText+' <div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
        submitButton.disabled = true;
        const submitButtonStyleDisplay = submitButton.getAttribute("style");
        submitButton.style["display"]="inline-block";
        
        
        const url     = element.attr("action");
        const method  = element.attr("method");
        // update value of ckeditor instances
        ckeditorInstance = element.find('textarea.customckeditor').attr("id");
        if(ckeditorInstance) CKEDITOR.instances[ckeditorInstance].updateElement(); 
        const content = element.serialize();
        let request = $.ajax({
            type: method,
            url: url,
            data: content,
            context: element
        });
        request.done(function(r) {
            submitButton.innerHTML = submitButtonText;
            submitButton.disabled = false;
            submitButton.setAttribute("style",submitButtonStyleDisplay);
            if(after) after(this);
        });
        request.fail(function(r) {
            submitButton.innerHTML = submitButtonText;
            submitButton.disabled = false;
            submitButton.innerHTML = submitButtonText+' <i class="fa fa-close" aria-hidden="true"></i> (error)'
        });
    }

    // Bewertung speichern
    $('.evaluation #comment form').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this));
        return false;
    });
    
    // Kommentar erstellen
    $('.discussionarea form[action="/homework/comment"]').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this),function(t){
            $(t).parent().prev().append('<li class="comment"><b class="name">'+$(t).find("div[data-username]").attr('data-username')+'</b><pre>'+$(t).find("textarea")[0].value+'</pre></li>');
            $(t).find("textarea")[0].value = "";
        });
        return false;
    });
    
    // Kommentar löschen
    $('.discussionarea ul.comments form').on("submit",function(e){
        if(e) e.preventDefault();
        if(confirm("Kommentar endgültig löschen?")){
            ajaxForm($(this),function(t){
                console.log($(t).closest("li.comment"));
                $(t).closest("li.comment").remove();
            });
        }
        return false;
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
        window.location.search = "?sort=" + escape($('#sortselection').val()) + "&desc=" + escape($('#desc').val());
    });
});