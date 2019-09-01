// set this to false to disable validation between pages (for testing)
const ValidationDisabled = false;

/* HELPER */

if (!NodeList.prototype.indexOf) {
    NodeList.prototype.indexOf = function(node) {
        return Array.from(this).indexOf(node);
    };
}
if (!NodeList.prototype.filter) {
    NodeList.prototype.filter = function(fct) {
        return Array.from(this).filter(fct);
    };
}
if (!NodeList.prototype.some) {
    NodeList.prototype.some = function(fct) {
        return Array.from(this).some(fct);
    };
}

/* MULTIPAGE INPUT FORM */

function getMaxSelectionIndex(){
    return document.querySelector(".stages").childElementCount;
}
function getSelectionIndex(){
    var radioButtons = document.querySelectorAll('.form input[type=radio]');
    return radioButtons.indexOf(radioButtons.filter((node)=>{return node.checked;})[0]) + 1;
}
function showInvalid(sectionNr){
    document.querySelector(`section[data-panel="section-${sectionNr}"]`).classList.add("show-invalid");
    document.querySelector(".content-wrapper").scrollTo(0,0);
}
function getSubmitPageIndex(){
    return document.querySelectorAll('form .panels section').indexOf(document.querySelector(`section.submit-page`)) + 1;
}
function isSubmitted(){
    return document.querySelector(".form").classList.contains('form-submitted');
}

function setSelectionByIndex(index, event){
    if(event){
        event.preventDefault();
    }
    function setSelection(index){
        const hideEvent = new CustomEvent("hideSection", {
            detail: {
                sectionIndex: getSelectionIndex()
            }
          });
        document.querySelector(`section[data-panel="section-${getSelectionIndex()}"]`).dispatchEvent(hideEvent);

        document.querySelector(`.form input[type="radio"]:nth-of-type(${index})`).checked = true;
        // set keyboard focus to first focusable element in the opened section.
        const firstInput = document.querySelector(`section[data-panel="section-${index}"]`).querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')[0];
        if(firstInput){
            firstInput.focus();
        }

        updateButton(index);

        const showEvent = new CustomEvent("showSection", {
            detail: {sectionIndex: index}
        });
        document.querySelector(`section[data-panel="section-${index}"]`).dispatchEvent(showEvent);
    }
    function findLatestInvalid(to){
        for (let i = 1; i <= to; i++) {
            if(!isSectionValid(i))
                return i;
        }
        return to;
    }
    const submitPageIndex = getSubmitPageIndex();
    const submitted = isSubmitted();
    if(submitted) {
        if(index > submitPageIndex)
            setSelection(index);
        else //prevent resubmit -> pages before unreachable
            setSelection(submitPageIndex + 1);
    }else {
        index = Math.min(index, submitPageIndex); //prevent skip of submit
        const latestInvalid = findLatestInvalid(index);
        if(latestInvalid >= index)
            setSelection(index);
        else {
            showInvalid(latestInvalid);
            setSelection(latestInvalid);
        }
    }
}
function updateButton(selectedIndex){
    const submitPage = document.querySelector(`section[data-panel="section-${selectedIndex}"]`).classList.contains('submit-page');
    let nextLabel = document.querySelector(`section[data-panel="section-${selectedIndex}"]`).dataset.nextLabel;
    if(!nextLabel){
        if(submitPage){
            nextLabel = document.querySelector('#nextSection').dataset.submitLabel;
        }else{
            nextLabel = document.querySelector('#nextSection').dataset.nextLabel;
        }
    }
    document.querySelector('#nextSection').innerHTML = nextLabel;

    if(selectedIndex === getMaxSelectionIndex()){
        document.querySelector('.form #nextSection').setAttribute("disabled","disabled");
        document.querySelector('.form #nextSection').classList.add("hidden");
    }else{
        document.querySelector('.form #nextSection').removeAttribute("disabled");
        document.querySelector('.form #nextSection').classList.remove("hidden");
    }
    if(selectedIndex === 1 || selectedIndex === getSubmitPageIndex()+1){
        document.querySelector('.form #prevSection').setAttribute("disabled","disabled");
    }else{
        document.querySelector('.form #prevSection').removeAttribute("disabled");
    }

    document.querySelector(".content-wrapper").scrollTo(0,0);
}

function isSectionValid(sectionIndex){
    if(ValidationDisabled) return true; // for testing only
    // negation is needed, because some() returns false on a blank array.
    return !document.querySelectorAll(`section[data-panel="section-${sectionIndex}"] input`).some((input)=>{
        return !input.checkValidity();
    });
}

function submitForm(event){
    if (this.checkValidity()) {
        event.preventDefault();
        const formSubmitButton = document.querySelector('#nextSection');
        formSubmitButton.disabled = true;
        $.ajax({
            url: this.getAttribute("action"),
            method: this.getAttribute("method"),
            data: $(this).serialize(),
            context: this
        }).done(function(response){
            if(response.type !== undefined){
                $.showNotification(response.message, response.type, response.time);
            }

            if(response.createdCourse){ 
                $('#addclass-create-topic').attr("href", "/courses/" + response.course._id + "/topics/add");
                $('#addclass-create-homework').attr("href", "/homework/new?course=" + response.course._id);
            }

            document.querySelector('.form').classList.add("form-submitted");
            formSubmitButton.disabled = false;
            // go to next page
            setSelectionByIndex(getSelectionIndex()+1, event);
        })
        .fail(function(response){
            if(response.responseText !== undefined){
                $.showNotification(`Fehler: ${response.responseText}`, "danger", true);
            }else{
                $.showNotification("Das Absenden des Formulars ist fehlgeschlagen. (unbekannter Fehler)", "danger", true);
            }
            formSubmitButton.disabled = false;
        });
    }else{
        $.showNotification("Formular ungültig, bitte füllen Sie alle Felder korrekt aus.", "danger", 6000);
    }
}

function nextSection(event){
    // ValidationEnabled is for testing only
    const isSubmitPage = ValidationDisabled? false : document.querySelector(`section[data-panel="section-${getSelectionIndex()}"]`).classList.contains('submit-page');
    if(ValidationDisabled){document.querySelector('.form').classList.add("form-submitted");};
    

    if(!isSubmitPage){
        event.preventDefault();
        const selectedIndex = getSelectionIndex() + 1;
        setSelectionByIndex(selectedIndex, event);
    }
    // else: no reaction -> should submit
   
}
function prevSection(event) {
    if(getSelectionIndex() > 1){
        const selectedIndex = getSelectionIndex() - 1;
        setSelectionByIndex(selectedIndex, event);
    }
}
function goToSection(event){
    const selectedIndex = document.querySelectorAll('.form .stages label').indexOf(this) + 1;
    setSelectionByIndex(selectedIndex, event);
}
window.addEventListener('DOMContentLoaded', ()=>{
    // Stepper
    //document.querySelectorAll('.form .stages label').addEventListener("click", goToSection);

    $('.form .stages label').on("click", goToSection);
    document.querySelector('.form #prevSection').addEventListener("click", prevSection);
    document.querySelector('.form #nextSection').addEventListener("click", nextSection);
    document.querySelector('.form').addEventListener("submit", submitForm);
});
window.addEventListener('load', ()=>{
    // open first page to toggle show event.
    setSelectionByIndex(1);
});