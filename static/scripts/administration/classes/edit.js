import '../../helpers/inputLinking';

function toggleDisabled(nodename, value){
    const node = document.querySelector(nodename);
    if(value != undefined){
        node.disabled = value;
    }else{
        node.disabled = !node.disabled;
    }
}
function toggleCustomClassSection(event){
    event.preventDefault();
    document.getElementById("createcustom").classList.toggle("hidden");
    document.querySelector(".class-default").classList.toggle("hidden");
    document.querySelector(".class-custom").classList.toggle("hidden");

    toggleDisabled('select[name="grade"]');
    toggleDisabled('input[name="classsuffix"]');

    toggleDisabled('input[name="classcustom"]');
    toggleDisabled('input[name="keepyear"]');
    validateForm();
}
function validateForm(event){
    function isFormValid(node){
        if (!NodeList.prototype.some) {
            NodeList.prototype.some = function(fct) {
                return Array.from(this).some(fct);
            };
        }
        return !node.querySelectorAll(`input, select`).some((input)=>{
            return !input.checkValidity();
        });
    }
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = !isFormValid(document.querySelector(".create-form"));
}
window.addEventListener('DOMContentLoaded', ()=>{
    if(document.querySelector('.section-classes-create')){
        document.querySelector(".createcustom").addEventListener("click", toggleCustomClassSection);
        document.querySelectorAll(".create-form input, .create-form select").addEventListener("change input keyup paste click", validateForm);
    }
    if(document.querySelector('.section-classes-edit')){
        // ...
    }
    document.querySelector('input[name="keepyear"]').addEventListener("input", ()=>{
        document.getElementById("recap-keepyear").classList.toggle("hidden");
       $('select[name="schoolyear"]').attr("disabled", function(_, attr){ return !attr});
    });
});
