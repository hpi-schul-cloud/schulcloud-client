function changeButtonText(event) {
    let button = this;
    let hiddenSchools = document.querySelector(button.dataset.target);
    if (hiddenSchools.classList.contains('in')) {
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