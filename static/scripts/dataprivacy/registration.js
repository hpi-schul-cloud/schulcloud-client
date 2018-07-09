window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showFormButton = document.querySelector('#showRegistrationForm');
    let radiou18 = document.getElementById("reg-u18");
    let radio18 = document.getElementById("reg-18");

    if(birthdateInput && showFormButton) {
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = `/administration/dataprivacy/registration`;
            
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
    
    // email validation js trigger
    $('input[type=email]').blur(function(event) {
        event.target.checkValidity();
    }).bind('invalid', function(event) {
        if($(event.target).attr("pattern")) {
            $(event.target).parent().find(".mailinfo").html("Bitte eine gültige E-Mail-Adresse mit Pattern " + $(event.target).attr("pattern") +" eingeben.");
        }
        setTimeout(function() { $(event.target).focus();}, 50);
    });
    
    // temp pin workaround
    document.querySelector(".pincorrect").addEventListener("click", ()=> {
        document.getElementById("userdata-summary").style.display = "block";
    });
});
window.addEventListener('load', ()=>{
    if(document.querySelector('.form .student-password')) {
        // generate password if password field present
        var words = ["auto", "baum", "bein", "blumen", "flocke", "frosch", "halsband", "hand", "haus", "herr", "horn", "kind", "kleid", "kobra", "komet", "konzert", "kopf", "kugel", "puppe", "rauch", "raupe", "schuh", "seele", "spatz", "taktisch", "traum", "trommel", "wolke"];
        var pw = words[Math.floor((Math.random() * words.length) + 1)] + Math.floor((Math.random() * 99) + 1).toString();
        $('.form .student-password').text(pw);
    }
});