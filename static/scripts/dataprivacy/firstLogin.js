import '../helpers/inputLinking';

window.addEventListener('DOMContentLoaded', ()=> {
    // show first login for existing users without age
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showLoginButton = document.querySelector('#showExistingLoginForm');
    let radio14 = document.getElementById("reg-14");
    
    if (birthdateInput && showLoginButton) {
        $('#showExistingLoginForm').on("click", ()=>{
            const baseUrl = '/firstLogin';
            if (radio14.checked){
                window.location.href = `${baseUrl}?ue14=true`;
            }else{
                window.location.href = `${baseUrl}?u14=true`;
            }
        });
        $("#welcome-screen input[type='radio']").on("change", () => {
            if (radio14.checked){
                showLoginButton.disabled = false;
            }else{
                showLoginButton.disabled = false;
            }
        });
    }
});