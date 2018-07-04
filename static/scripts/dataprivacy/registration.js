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