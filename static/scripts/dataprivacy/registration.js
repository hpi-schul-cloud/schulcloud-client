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

    // temp pin workaround
    document.querySelector(".pincorrect").addEventListener("click", ()=> {
        document.getElementById("userdata-summary").style.display = "block";
    });
    
    // basic pin prototype
    $('.pin-input input.digit:last-child').on('change', (event) => {
        let pinInput = document.querySelector('input[name="email-pin"]');
        if(pinInput.checkValidity()){
            console.log("submitting pin:", pinInput.value);
        }else{
            pinInput.parentElement.parentElement.classList.add("show-invalid");
        }
        // ajax check code
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

window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.form section').forEach((section) => {
        section.addEventListener("showSection", (event) => {
            console.log("show section", event.detail.sectionIndex, event.target);
        });
    });
});

window.addEventListener('load', ()=>{
    if(document.querySelector('.form .pin-input')) {
        console.log("generate pin");
        let usermail = document.querySelector("input[name='parent-email']").value ? document.querySelector("input[name='parent-email']").value : document.querySelector("input[name='student-email']").value;
        console.log("mail: " +usermail);
        $.ajax({
            url: "/administration/pinvalidation",
            method: "POST",
            data: {"email": usermail}
        }).done(function(pin){
            if(pin)
                document.getElementById("tempPin").text(pin);
            else {
                //TODO
                alert("fehler bei der pin erstellung");
            }
        }).fail(function(err){
            console.log(err);
        });
    }
});