var $stars = $('.rating-star .fa');

var initStars = function() {
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

$stars.on('click', function(star) {
    if(this.readonly == true){
        $stars.siblings('input.rating-value[id='+ this.id +']').val($(this).data('rating'));
        return initStars();
    }
});

initStars();

$(document).ready(function() {

});