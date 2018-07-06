window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showFormButton = document.querySelector('#showRegistrationForm');

    if(birthdateInput && showFormButton) {
        alert("a");
        document.querySelector('#showRegistrationForm').addEventListener("click", ()=>{
            alert("b");
            const baseUrl = `/administration/dataprivacy/registration`;
            
            let radiou18 = document.getElementById("reg-u18");
            if(radiou18.checked){
                window.location.href = `${baseUrl}/byparent`;
            }else{
                window.location.href = `${baseUrl}/bystudent`;
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
}