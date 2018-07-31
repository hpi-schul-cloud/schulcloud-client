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
                window.location.href = `${baseUrl}/byparent/${classId}`;
            }else{
                window.location.href = `${baseUrl}/bystudent/${classId}`;
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
    
    $('.form section[data-feature="pin"]').on("showSection", (event) => {
        $("#send-pin, #resend-pin, #pinverification").show();
        $("#userdata-summary").hide();
        sendPin();
    });
    
    $('#resend-pin').on("click", e => {
        e.preventDefault();
        sendPin(true);
        $(".pin-input .digit").val("");
    });
    
    function sendPin(sendConfirm) {
        let usermail = $("input[name='parent-email']") ? $("input[name='parent-email']").val() : $("input[name='student-email']").val;
        $.ajax({
            url: "/registration/pinvalidation",
            method: "POST",
            data: {"email": usermail}
        }).done(success => {
            if (sendConfirm)
                $.showNotification(`PIN erfolgreich an ${usermail} verschickt.`, "success", 3000);
        }).fail(function(err){
            $.showNotification("Fehler bei der PIN-Erstellung! Bitte versuche es mit 'Code erneut zusenden' oder prüfe deine E-Mail-Adresse.", "danger", 7000);
        });
    }
    
    // TODO: deprecated? save to delete?
    // workaround
    $('#check-pin').on('click', checkPin);
    // basic pin prototype
    $('.pin-input .combined').on('input', checkPin);
    
    function checkPin(e) {
        e.preventDefault();
        let pinInput = document.querySelector('input[name="email-pin"]');
        let usermail = $("input[name='parent-email']") ? $("input[name='parent-email']").val() : $("input[name='student-email']").val;
        if(pinInput.checkValidity()){
            console.log("submitting pin:"+pinInput.value+" with mail: "+usermail );
            $.ajax({
                url: "/registration/pinvalidation",
                method: "GET",
                data: {email: usermail, pin: pinInput.value}
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
            $(pinInput).parents("section").addClass("show-invalid");
        }
        // ajax check code
    }
});
window.addEventListener('load', ()=>{
    if(document.querySelector('.form .student-password')) {
        // generate password if password field present
        var words = ["auto", "baum", "bein", "blumen", "flocke", "frosch", "halsband", "hand", "haus", "herr", "horn", "kind", "kleid", "kobra", "komet", "konzert", "kopf", "kugel", "puppe", "rauch", "raupe", "schuh", "seele", "spatz", "taktisch", "traum", "trommel", "wolke"];
        var pw = words[Math.floor((Math.random() * words.length) + 1)] + Math.floor((Math.random() * 99) + 1).toString();
        $('.form .student-password').text(pw);
    }
});