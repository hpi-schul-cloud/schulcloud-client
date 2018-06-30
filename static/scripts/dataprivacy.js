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
if (!NodeList.prototype.filter) {
    NodeList.prototype.filter = function(fct) {
        return Array.from(this).filter(fct);
    }
}
if (!NodeList.prototype.some) {
    NodeList.prototype.some = function(fct) {
        return Array.from(this).some(fct);
    }
}


/* MULTIPAGE INPUT FORM */

function getMaxSelectionIndex(){
    return document.querySelector(".stages").childElementCount;
}
function getSelectionIndex(){
    var radioButtons = document.querySelectorAll('.form input[type=radio]');
    return radioButtons.indexOf(radioButtons.filter((node)=>{return node.checked;})[0]) + 1;
}
function setSelectionByIndex(index, event){
    if(isSectionValid(getSelectionIndex())){
        document.querySelector('.form input[type="radio"]:nth-of-type(' + index + ')').checked = true;
        updateButton(index);
    }else{
        event.preventDefault();
        document.querySelector(`section[data-panel="section-${getSelectionIndex()}"]`).classList.add("showInvalid");
    }
}
function updateButton(selectedIndex){
    if(selectedIndex == getMaxSelectionIndex()){
        document.querySelector('#nextSection').innerHTML = document.querySelector('#nextSection').dataset.submitLabel;
    }else{
        document.querySelector('#nextSection').innerHTML = document.querySelector('#nextSection').dataset.nextLabel;
    }

    if(selectedIndex == 1){
        document.querySelector('.form #prevSection').setAttribute("disabled","disabled");
    }else{
        document.querySelector('.form #prevSection').removeAttribute("disabled");
    }
    document.querySelector(".content-wrapper").scrollTo(0,0);
}

function isSectionValid(sectionIndex){
    // negation is needed, because some() returns false on a blank array.
    return !document.querySelectorAll(`section[data-panel="section-${sectionIndex}"] input`).some((input)=>{
        return !input.checkValidity();
    });
}

function nextSection(event){
    const selectedIndex = getSelectionIndex() + 1;
    if(selectedIndex <= getMaxSelectionIndex()){
        event.preventDefault();
        setSelectionByIndex(selectedIndex, event);
    }
}
function prevSection(event) {
    const selectedIndex = getSelectionIndex() - 1;
    setSelectionByIndex(selectedIndex, event);
}
window.addEventListener('DOMContentLoaded', ()=>{
    // Stepper
    document.querySelectorAll('.form .stages label').addEventListener("click", function(event) {
        const selectedIndex = document.querySelectorAll('.form .stages label').indexOf(this) + 1;
        setSelectionByIndex(selectedIndex, event);
    });
    document.querySelector('.form #prevSection').addEventListener("click", prevSection);
    document.querySelector('.form #nextSection').addEventListener("click", nextSection);
});


/* INPUT LINKING */
function linkInputs(event){
    document.querySelectorAll(`*[data-from=${this.getAttribute("name")}]`).forEach((changeTarget)=>{
        if(changeTarget.tagName == "INPUT"){
            changeTarget.value = this.value;
        }else{
            changeTarget.innerHTML = this.value;
        }
    });
}
window.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll(".linked").addEventListener("change keyup paste click", linkInputs);
});


/* OTHER STUFF */
window.addEventListener('load', ()=>{
    // TIME Picker
    // https://xdsoft.net/jqplugins/datetimepicker/
    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({ 
        format:'d.m.Y H:i',
        mask: '39.19.9999 29:59'
    });
    $('input[data-date]').datetimepicker({
        format:'d.m.Y',
        timepicker:false,
        mask: '39.19.9999',
        startDate: ($('input[data-date]').data('startDate') || false),
        minDate: ($('input[data-date]').data('minDate') || 'yesterday'), //yesterday is minimum date(for today use 0 or -1970/01/01)
        maxDate: ($('input[data-date]').data('maxDate') || 'tomorrow')  //tomorrow is maximum date calendar
    });
});