window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-birthdate"]');
    let showFormButton = document.querySelector('#showRegistrationForm');

    if(birthdateInput && showFormButton){
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            const baseUrl = `/administration/dataprivacy/registration`;

            // TODO - parse date and validate is not working
            selectedDate = Date.parse(birthdateInput.value);
            var okayDate = new Date();
            okayDate.setFullYear( okayDate.getFullYear() - 18 );
            
            if(selectedDate > okayDate){
                window.location.href = `${baseUrl}/byparent?student-birthdate=${birthdateInput.value}`;
            }else{
                window.location.href = `${baseUrl}/bystudent?student-birthdate=${birthdateInput.value}`;
            }
        });
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