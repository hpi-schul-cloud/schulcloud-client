function toggleDisabled(nodename, value){
    const node = document.querySelector(nodename);
    if(value != undefined){
        node.disabled = value;
    }else{
        node.disabled = !node.disabled;
    }
    if(node.tagName == "SELECT"){
        node.dispatchEvent(new Event('chosen:updated'));
    }
}
function toggleCreateClassSection(event){
    event.preventDefault();
    document.getElementById("createnew").classList.toggle("hidden");
    toggleDisabled('select[name="classid"]');
    toggleDisabled('select[name="grade"]');
    validateForm();
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
function validateForm(){
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
    document.querySelector(".createnew").addEventListener("click", toggleCreateClassSection);
    document.querySelector(".createcustom").addEventListener("click", toggleCustomClassSection);
    //document.querySelector("button[type=submit]").addEventListener("click", validateBeforeSubmit);
    document.querySelectorAll(".create-form input, .create-form select").addEventListener("change input keyup paste click", validateForm);
});