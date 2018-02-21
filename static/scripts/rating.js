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

   var ratings = {data :[]};
   var inputs = $('.rating-value');
   inputs.each((item) =>{
       if(this.id === inputs[item].id){
           var rate = {};
           rate.ID = inputs[item].id;
           rate.value = inputs[item].value;
           ratings.data.push(rate);
           $('.content[id='+this.id+']').remove();
       }
   });
   $.ajax({
        url: '/content/rate',
        type: 'post',
        data : ratings,
        dataType: 'json'
    });
});


$(document).ready(function() {

    $('#InboxContent').on('show.bs.modal', function (event) { // id of the modal with event
        $(this).load("/content/rate/rating");

    });

});