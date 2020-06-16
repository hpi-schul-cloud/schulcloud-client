$(document).ready(function() {
    var $modals = $('.modal');
    var $deleteModal = $('.delete-modal');

    var reloadLesson = function(href) {
        if(!href){
            window.location.reload();
        }else{
            window.location.href=href;
        }
    };

    function showAJAXError(req, textStatus, errorThrown) {
        $deleteModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification($t('global.error.requestTimeout'), "warn");
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    $('a[data-method="DELETE"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text($t('homework.text.doYouReallyWantToDelete', {name : $buttonContext.data('name')}));
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                error: showAJAXError,
                success: function(result) {
                    reloadLesson($buttonContext.attr('redirect'));
                },
            });
        });
    });

    $deleteModal.find('.close, .btn-close').on('click', function() {
        $deleteModal.modal('hide');
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

});