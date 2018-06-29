/* HELPER */

if (!NodeList.prototype.addEventListener) {
    NodeList.prototype.addEventListener = function(events, callback, useCapture) {
        this.forEach((entry)=>{
            events.split(" ").forEach((event)=>{
                entry.addEventListener(event, callback, useCapture);
            });
        });
        return this;
    };
}
if (!NodeList.prototype.indexOf) {
    NodeList.prototype.indexOf = function(node) {
        return Array.from(this).indexOf(node);
    }
}


/* MULTIPAGE INPUT FORM */

function getMaxSelectionIndex(){
    return document.querySelector(".stages").childElementCount;
}
function getSelectionIndex(){
    var radioButtons = document.querySelectorAll('.form input:radio');
    return radioButtons.indexOf(radioButtons.filter(':checked')) + 1;
}
function setSelectionByIndex(index){
    document.querySelector('.form input[type="radio"]:nth-of-type(' + index + ')').checked = true;
    updateButton(index);
}
function updateButton(selectedIndex){
    if(selectedIndex == getMaxSelectionIndex()){
        document.querySelector('#nextSection').innerHTML = 'Submit';
    }else{
        document.querySelector('#nextSection').innerHTML = 'Next';
    }

    if(selectedIndex == 1){
        document.querySelector('.form #prevSection').setAttribute("disabled","disabled");
    }else{
        document.querySelector('.form #prevSection').removeAttribute("disabled");
    }
    document.querySelector(".content-wrapper").scrollTo(0,0);
}

function nextSection(event){
    const selectedIndex = getSelectionIndex() + 1;
    if(selectedIndex <= getMaxSelectionIndex()){
        event.preventDefault();
        setSelectionByIndex(selectedIndex);
    }
}
function prevSection(event) {
    const selectedIndex = getSelectionIndex() - 1;
    setSelectionByIndex(selectedIndex);
}
window.addEventListener('DOMContentLoaded', ()=>{
    // Stepper
    document.querySelectorAll('.form .stages label').addEventListener("click", function() {
        updateButton(document.querySelectorAll('.form .stages label').indexOf(this) + 1);
    });
    document.querySelector('.form #prevSection').addEventListener("click", prevSection);
    document.querySelector('.form #nextSection').addEventListener("click", nextSection);
});



/* INPUT LINKING */
function linkInputs(event){
    const linkedInputs = document.querySelectorAll(`input[data-from="${this.id}"]`);
    linkedInputs.forEach((input)=>{
        input.value = this.value;
    });
}
window.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll(".linked").addEventListener("change keyup paste click", linkInputs);
});



/* OTHER STUFF */
window.addEventListener('load', ()=>{
    // TIME Picker
    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({ 
        format:'d.m.Y H:i',
        mask: '39.19.9999 29:59'
    });
    $('input[data-date]').datetimepicker({
        format:'d.m.Y',
        mask: '39.19.9999'
    });
});