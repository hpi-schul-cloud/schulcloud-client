$(document).ready(function () {
    $("div#openCard").on("click", e => {
        let container = $(e.currentTarget).parents("div.content").prev("#modal-container-personcard");
        container.removeAttr('class').addClass("show");
    
        container.one("click", () => {
            container.addClass("out");
            $('body').removeClass('modal-active');
            setTimeout(
                function () {
                    container.removeAttr('class');
                }, 250);
        });
    
        $('body').addClass('modal-active');
    });

    $('.modal-content').click(function (e) {
        if ($(e.target).is('a'))
            return true;

        if ($(e.target).is('button.close'))
            return true;

        if ($(e.target).is('i.fa.fa-times'))
            return true;

        return false;
    });

    $(document).on('mousemove', function(e){
        $('.light').css({
            left:  e.pageX - 300,
            top:   e.pageY - 300
        });
    });

    var el = $('.js-tilt-container');

    el.on('mousemove', function(e){
        const {left, top} = $(this).offset();
        const cursPosX = e.pageX - left;
        const cursPosY = e.pageY - top;
        const cursFromCenterX = $(this).width() / 2 - cursPosX;
        const cursFromCenterY = $(this).height() / 2 - cursPosY;


        $(this).css('transform','perspective(500px) rotateX('+ (cursFromCenterY / 40) +'deg) rotateY('+ -(cursFromCenterX / 40) +'deg) translateZ(10px)');

        const invertedX = Math.sign(cursFromCenterX) > 0 ? -Math.abs( cursFromCenterX ) : Math.abs( cursFromCenterX );

        //Parallax transform on image
        $(this).find('.js-perspective-neg').css('transform','translateY('+ ( cursFromCenterY / 10) +'px) translateX('+ -(invertedX  / 10) +'px) scale(1.15)');

        $(this).removeClass('leave');
    });

    el.on('mouseleave', function(){
        $(this).addClass('leave');
    });
});