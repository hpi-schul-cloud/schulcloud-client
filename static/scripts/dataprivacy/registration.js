window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showFormButton = document.querySelector('#showRegistrationForm');
    let radiou18 = document.getElementById("reg-u18");
    let radio18 = document.getElementById("reg-18");

    if(birthdateInput && showFormButton) {
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = '/registration';
            let classId = $("input[name=classId]").val();
            
            if(radiou18.checked){
                window.location.href = `${baseUrl}/${classId}/byparent`;
            }else{
                window.location.href = `${baseUrl}/${classId}/bystudent`;
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
    $('form.registration-form.student input[name="student-email"], form.registration-form.parent input[name="parent-email"]').on("change", ()=> {
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
        let usermail = $("input[name='parent-email']").length ? $("input[name='parent-email']").val() : $("input[name='student-email']").val();
        let byParent = window.location.href.indexOf("parent") > 0 ? true : false;
        
        $.ajax({
            url: "/registration/pinvalidation",
            method: "POST",
            data: {"email": usermail, "byParent": byParent}
        }).done(success => {
            if(sendConfirm) {
                $.showNotification(`PIN erfolgreich an ${usermail} verschickt.`, "success", 3000);
            }
            $("input[name='pin-sent']").val("yes");
        }).fail(function(err){
            $.showNotification("Fehler bei der PIN-Erstellung! Bitte versuche es mit 'Code erneut zusenden' oder prüfe deine E-Mail-Adresse.", "danger", 7000);
        });
    }
    
    // deprecated, built into controller
    function checkPin(e) {
        e.preventDefault();
        let pinInput = document.querySelector('input[name="email-pin"]');
        let usermail = $("input[name='parent-email']") ? $("input[name='parent-email']").val() : $("input[name='student-email']").val;
        if(pinInput.checkValidity()){
            $.ajax({
                url: `/registration/pinvalidation?email=${usermail}&pin=${pinInput.value}`,
                method: "GET"
            }).done(function(response){
                console.log(response);
                if(response==="verified") {
                    $.showNotification("PIN erfolgreich verifiziert.", "success", 4000);
                    $("#send-pin, #resend-pin, #pinverification, #userdata-summary").toggle();
                } else if (response==="wrong") {
                    $.showNotification("Falscher PIN-Code, bitte erneut versuchen.", "danger", 4000);
                } else {
                    $.showNotification("Fehler bei der PIN-Überprüfung!", "danger", 4000);
                }
            }).fail(function(err){
                $.showNotification("Fehler bei der PIN-Überprüfung!", "danger", 4000);
            });
        }else{
            $(pinInput).closest("section").addClass("show-invalid");
        }
        // ajax check code
    }

    let parentMailInput = document.querySelector('input[name="parent-email"]');
    let studentMailInput = document.querySelector('input[name="student-email"]');
    if(parentMailInput && studentMailInput){
        function validateDifferent(event){
            if(parentMailInput.value && studentMailInput.value && parentMailInput.value == studentMailInput.value){
                parentMailInput.setCustomValidity("Für den Schüler muss eine andere Mailadresse als für die Eltern angegeben werden.");
                $(parentMailInput).closest("section").addClass("show-invalid");
            }else{
                parentMailInput.setCustomValidity('');
            }
        }
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
function goBack(event){
    event.stopPropagation();
    event.preventDefault();
    window.history.back();
}

window.addEventListener('load', ()=>{
    if(document.querySelector('.form .student-password')) {
        // generate password if password field present
        var words = ["auto", "baum", "bein", "blumen", "flocke", "frosch", "halsband", "hand", "haus", "herr", "horn", "kind", "kleid", "kobra", "komet", "konzert", "kopf", "kugel", "puppe", "rauch", "raupe", "schuh", "seele", "spatz", "taktisch", "traum", "trommel", "wolke"];
        var pw = words[Math.floor((Math.random() * words.length))] + Math.floor((Math.random() * 99)).toString();
        $('.form .student-password').text(pw);
        $('.form .student-password-input').val(pw);
    }
});