import '../helpers/inputLinking';

window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showFormButton = document.querySelector('#showRegistrationForm');
    let radiou18 = document.getElementById("reg-u18");
    let radio18 = document.getElementById("reg-18");

    if(birthdateInput && showFormButton) {
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = '/registration';
            let classOrSchoolId = $("input[name=classOrSchoolId]").val();
            let additional = "";
            additional += $("input[name=sso]").val() === "true" ? 'sso/'+$("input[name=account]").val() : '';
            additional += $("input[name=importHash]").val() !== undefined ? '&importHash='+encodeURIComponent($("input[name=importHash]").val()) : '';
            additional += $("input[name=userId]").val() !== undefined ? '&userId='+encodeURIComponent($("input[name=userId]").val()) : '';
            additional += $("input[name=firstName]").val() !== undefined ? '&firstName='+encodeURIComponent($("input[name=firstName]").val()) : '';
            additional += $("input[name=lastName]").val() !== undefined ? '&lastName='+encodeURIComponent($("input[name=lastName]").val()) : '';
            additional += $("input[name=email]").val() !== undefined ? '&email='+encodeURIComponent($("input[name=email]").val()) : '';
            additional += $("input[name=birthday]").val() !== undefined ? '&birthday='+encodeURIComponent($("input[name=birthday]").val()) : '';
            additional.charAt(0) === "&" ? additional = additional.replace("&","?") : "";

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
    
    // if email for pin registration is changed, reset pin-sent status
    $('form.registration-form.student input[name$="email"]:last').on("change", ()=> {
        $("input[name='pin-sent']").val("no");
    });
    
    $('.form section[data-feature="pin"]').on("showSection", (event) => {
        if($("input[name='pin-sent']").val() !== "no") {
            // send pin of value is something else than no
        } else {
            sendPin(true);
        }
    });
    
    $('#resend-pin').on("click", e => {
        e.preventDefault();
        sendPin(true);
        $(".pin-input .digit").val("");
    });
    
    function sendPin(sendConfirm) {
        let usermail = $("input[name$='email']:last").val();
        let byRole = window.location.pathname.split("/by")[1].replace("/","");
        
        $.ajax({
            url: "/registration/pincreation",
            method: "POST",
            data: {"email": usermail, "byRole": byRole}
        }).done(success => {
            if(sendConfirm) {
                $.showNotification(`Eine PIN wurde erfolgreich an ${usermail} versendet.`, "success", 15000);
            }
            $("input[name='pin-sent']").val("yes");
        }).fail(function(err){
            $.showNotification(`Fehler bei der PIN-Erstellung! Bitte versuche es mit 'Code erneut zusenden' und prüfe deine E-Mail-Adresse (${usermail}).`, "danger", 7000);
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

    const firstSection = document.querySelector('.form section[data-panel="section-1"]');
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

window.addEventListener('load', ()=>{
    if(document.querySelector('.form .student-password')) {
        // generate password if password field present
        var words = ["auto", "baum", "bein", "blumen", "flocke", "frosch", "halsband", "hand", "haus", "herr", "horn", "kind", "kleid", "kobra", "komet", "konzert", "kopf", "kugel", "puppe", "rauch", "raupe", "schuh", "seele", "spatz", "taktisch", "traum", "trommel", "wolke"];
        var pw = words[Math.floor((Math.random() * words.length))] + Math.floor((Math.random() * 98)+1).toString();
        $('.form .student-password').text(pw);
        $('.form .student-password-input').val(pw);
    }
});