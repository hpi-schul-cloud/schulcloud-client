var $stars = $('.rate .rate-item');

function initStars(stars) {
    return $stars.each(function(star) {
        var raitingValue = parseFloat($stars.siblings('input.rating-value[id='+ $stars[star].id +']').val());
        var starValue    = parseInt($(this).data('rating'));
        if (raitingValue >= starValue) {
            return $(this).removeClass('fa-star-o').removeClass('fa-star-half-o').addClass('fa-star');
        } else {
            var hafstarValue= starValue -0.5;
            if (raitingValue >= hafstarValue) {

                return $(this).removeClass('fa-star-0').removeClass('fa-star').addClass('fa-star-half-o');
            }else{
                return $(this).removeClass('fa-star').removeClass('fa-star-half-o').addClass('fa-star-o');
            }
        }
    });
};

function onStarClick() {
    if( this.getAttribute("readonly") === "false"){
        $stars.siblings('input.rating-value[id='+ this.id +']').val($(this).data('rating'));
        return initStars();
    }
}
$stars.on('click', onStarClick);

initStars();

$('.btn-send-rate').on('click', function () {
    const input = $(`.rating-value[data-actualid=rating${this.id}]`);
    console.log(input)
    if(input.length === 0){
        return;
    }

    const rating = {
        materialId: input[0].id,
        rating: Number(input[0].value || 0)
    };
    $(`#${this.id}`).remove();


    $.ajax({
        url: '/content/rate',
        type: 'post',
        data : rating,
        dataType: 'json'
    });
});


$(document).ready(function() {

    $('#InboxContent').on('show.bs.modal', function (event) { // id of the modal with event
        $(this).load("/content/rate/rating");

    });

});