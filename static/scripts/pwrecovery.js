

function connectConfirmPassword(){
    var password = document.getElementById("password")
    , confirm_password = document.getElementById("password_control");

    function validatePassword(){
        if(password.value != confirm_password.value) {
            confirm_password.setCustomValidity($t('pwRecovery.text.passwordsAreDifferent'));
        } else {
            confirm_password.setCustomValidity('');
        }
    }

    if(password && confirm_password){
        ["change", "keyup"].forEach(event => {
            password.addEventListener(event, validatePassword);
            confirm_password.addEventListener(event, validatePassword);
        });
    }
}

document.addEventListener("DOMContentLoaded", connectConfirmPassword);