$(document).ready(function() {

    function ajaxForm(element, after){
        const submitButton = element.find('[type=submit]')[0];
        let submitButtonText = submitButton.innerHTML || submitButton.value;
        submitButtonText = submitButtonText.replace(' <i class="fa fa-close" aria-hidden="true"></i> (error)',"");
        submitButton.innerHTML = submitButtonText+' <div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
        submitButton.disabled = true;
        const submitButtonStyleDisplay = submitButton.getAttribute("style");
        submitButton.style["display"]="inline-block";
        
        
        const url     = element.attr("action");
        const method  = element.attr("method");
        // update value of ckeditor instances
        let ckeditorInstance = element.find('textarea.customckeditor').attr("id");
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
            submitButton.disabled = false;
            submitButton.innerHTML = submitButtonText+' <i class="fa fa-close" aria-hidden="true"></i> (error)';
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
                $(t).closest("li.comment").remove();
            });
        }
        return false;
    });

    function updateSearchParameter(key, value) {
        let url = window.location.search;
        let reg = new RegExp('('+key+'=)[^\&]+');
        window.location.search = (url.indexOf(key) !== -1)?(url.replace(reg, '$1' + value)):(url + ((url.indexOf('?') == -1)? "?" : "&") + key + "=" + value);
    }

    $('#desc').on('click', function(){
        updateSearchParameter("desc", escape($('#desc').val()));
    });
    $('#sortselection').on('change',  function(){
        updateSearchParameter("sort", escape($('#sortselection').val()));
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