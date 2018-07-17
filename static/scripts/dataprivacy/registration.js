window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showFormButton = document.querySelector('#showRegistrationForm');
    let radiou18 = document.getElementById("reg-u18");
    let radio18 = document.getElementById("reg-18");

    if(birthdateInput && showFormButton) {
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = '/registration';
            
            if(radiou18.checked){
                window.location.href = `${baseUrl}/byparent`;
            }else{
                window.location.href = `${baseUrl}/bystudent`;
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
        console.log("generate pin");
        let usermail = document.querySelector("input[name='parent-email']") ? document.querySelector("input[name='parent-email']").value : document.querySelector("input[name='student-email']").value;
        console.log("mail: " +usermail);
        $.ajax({
            url: "/registration/pinvalidation",
            method: "POST",
            data: {"email": usermail}
        }).done(function(pin){
            if(pin)
                alert(pin); // successful, remove whole done() if everything is working, not needed
        }).fail(function(err){
            $.showNotification("Fehler bei der PIN-Erstellung!", "danger", 4000);
        });
    });
    
    // workaround
    $('#check-pin').on('click', (e) => {
        checkPin(e);
    });
    // basic pin prototype
    $('.pin-input .combined').on('input', (e) => {
        checkPin(e);
    });
    
    function checkPin(e) {
        e.preventDefault();
        let pinInput = document.querySelector('input[name="email-pin"]');
        console.log(pinInput.value);
        console.log(pinInput.checkValidity());
        let usermail = document.querySelector("input[name='parent-email']") ? document.querySelector("input[name='parent-email']").value : document.querySelector("input[name='student-email']").value;
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
                    $("#pinverification").hide();
                    $("#send-pin, #resend-pin").remove();
                    $("#userdata-summary").show();
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