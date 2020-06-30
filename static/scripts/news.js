$(document).ready(function() {
    $('#news-form').on('submit',function(e){
       e.preventDefault();
       if(CKEDITOR.instances.content.getData().length == 0){
           $.showNotification("News benötigen Inhalt!", "danger", 10000);
       }else if($("input[name=title]").val().length == 0){
           $.showNotification("News benötigen einen Titel!", "danger", 10000);
       }else{
           this.submit();
       }
    });
});