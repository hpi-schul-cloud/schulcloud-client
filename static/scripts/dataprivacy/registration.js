import './dataprivacy';

window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let radiou18 = document.getElementById("reg-u18");
    let radio18 = document.getElementById("reg-18");

    if(document.querySelector('#showRegistrationForm')) {
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = '/registration';

            let classOrSchoolId = $("input[name=classOrSchoolId]").val();
            let additional = "";
            additional += $("input[name=sso]").val() === "true" ? 'sso/'+$("input[name=account]").val() : '';
            additional += $("input[name=importHash]").val() !== undefined ? '?importHash='+encodeURIComponent($("input[name=importHash]").val()) : '';

            if(radiou18.checked){
                window.location.href = `${baseUrl}/${classOrSchoolId}/byparent/${additional}`;
            }else{
                window.location.href = `${baseUrl}/${classOrSchoolId}/bystudent/${additional}`;
            }
        });
        $("input[type='radio']").on("change", () => {
            if(radio18.checked) {
                document.getElementById("infotext-18").style.display = "block";
                document.getElementById("infotext-u18").style.display = "none";
                document.getElementById("showRegistrationForm").disabled = false;
            } else {
                document.getElementById("infotext-18").style.display = "none";
                document.getElementById("infotext-u18").style.display = "block";
                document.getElementById("showRegistrationForm").disabled = false;
            }
        });
    }


    let parentMailInput = document.querySelector('input[name="parent-email"]');
    let studentMailInput = document.querySelector('input[name="student-email"]');
    if(parentMailInput && studentMailInput){
        "change input keyup paste".split(" ").forEach(function(event){
            parentMailInput.addEventListener(event, validateDifferent, false);
            studentMailInput.addEventListener(event, validateDifferent, false);
          });
    }

    const firstSection = document.querySelector('.form section[data-panel="section-1"]:not(.noback)');
    if(firstSection){
        firstSection.addEventListener("showSection", (event) => {
            const backButton = document.getElementById("prevSection");
            backButton.addEventListener("click", goBack);
            backButton.removeAttribute("disabled");
        });
        firstSection.addEventListener("hideSection", (event) => {
            const backButton = document.getElementById("prevSection");
            backButton.removeEventListener("click", goBack);
        });
    }
});
function validateDifferent(){
    let parentMailInput = document.querySelector('input[name="parent-email"]');
    let studentMailInput = document.querySelector('input[name="student-email"]');
    if(parentMailInput.value && studentMailInput.value && parentMailInput.value === studentMailInput.value){
        parentMailInput.setCustomValidity("Für den Schüler muss eine andere Mailadresse als für die Eltern angegeben werden.");
        $(parentMailInput).closest("section").addClass("show-invalid");
    }else{
        parentMailInput.setCustomValidity('');
    }
}
function goBack(event){
    event.stopPropagation();
    event.preventDefault();
    window.history.back();
}


// GENERATE START PASSWORD
window.addEventListener('load', ()=>{
    if(document.querySelector('.form .student-password')) {
        // generate password if password field present
        var words = ["auto", "baum", "bein", "blumen", "flocke", "frosch", "halsband", "hand", "haus", "herr", "horn", "kind", "kleid", "kobra", "komet", "konzert", "kopf", "kugel", "puppe", "rauch", "raupe", "schuh", "seele", "spatz", "taktisch", "traum", "trommel", "wolke"];
        var pw = words[Math.floor((Math.random() * words.length))] + Math.floor((Math.random() * 98)+1).toString();
        $('.form .student-password').text(pw);
        $('.form .student-password-input').val(pw).trigger("input");
    }
});