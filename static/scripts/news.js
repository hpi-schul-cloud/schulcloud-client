$(document).ready(function() {
    $('#news-form').on('submit',function(e){
       e.preventDefault();
       if(CKEDITOR.instances.content.getData().length == 0){
           $.showNotification($t('news.text.newsNeedContent'), "danger", 10000);
       }else if($("input[name=title]").val().length == 0){
           $.showNotification($t('news.text.newsNeedTitle'), "danger", 10000);
       }else{
           this.submit();
       }
    });
});