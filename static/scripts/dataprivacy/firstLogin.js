import '../helpers/inputLinking';

window.addEventListener('DOMContentLoaded', ()=> {
    // show first login for existing users without age
    let birthdateInput = document.querySelector('input[name="student-age"]');
    let showLoginButton = document.querySelector('#showExistingLoginForm');
    let radio1417 = document.getElementById("reg-1417");
    let radio18 = document.getElementById("reg-18");

    
    if (birthdateInput && showLoginButton) {
        $('#showExistingLoginForm').on("click", ()=>{
            const baseUrl = '/firstLogin';
            if (radio1417.checked){
                window.location.href = `${baseUrl}?ue14=true`;
            }else if(radio18.checked){
                window.location.href = `${baseUrl}?ue18=true`;
            }else{
                window.location.href = `${baseUrl}?u14=true`;
            }
        });
        $("#welcome-screen input[type='radio']").on("change", () => {
            if (radio1417.checked){
                showLoginButton.disabled = false;
            }else if(radio18.checked){
                showLoginButton.disabled = false;
            }else{
                showLoginButton.disabled = false;
            }
        });
    }
});