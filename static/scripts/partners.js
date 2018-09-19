function changeButtonText(event) {
    let button = this;
    let hiddenPartners = document.querySelector(button.dataset.target);
    if (hiddenPartners.classList.contains('in')) {
        button.innerHTML = 'mehr anzeigen<i class="fa fa-angle-down" aria-hidden="true"></i>';
    }
    else {
        button.innerHTML = 'weniger anzeigen<i class="fa fa-angle-up" aria-hidden="true"></i>';
    }
}
window.addEventListener("load", function(){
    document.querySelectorAll('.toggle-partner').forEach(function(button){
        button.addEventListener('click', changeButtonText)
    });
});
    
