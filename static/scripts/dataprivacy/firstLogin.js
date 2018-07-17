window.addEventListener('DOMContentLoaded', ()=>{
    // show steppers depending on age of student
    let birthdateInput = document.querySelector('input[name="student-birthdate"]');
    let showFormButton = document.querySelector('#showLoginForm');

    if(birthdateInput && showFormButton) {
        document.querySelector('input[name="student-birthdate"]').addEventListener("click", ()=> {
            document.getElementById("showLoginForm").disabled = false;
        })
        document.querySelector('#showLoginForm').addEventListener("click", ()=>{
            const baseUrl = `/administration/dataprivacy/firstLoginExisting`;
            
            document.getElementById("birthdate").value 
        });
    }

});