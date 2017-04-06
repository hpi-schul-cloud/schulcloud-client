$(document).ready(function() {
    var password = document.getElementById("password_new")
        , confirm_password = document.getElementById("password_control");

    function validatePassword(){
        if(password.value != confirm_password.value) {
            confirm_password.setCustomValidity("Passwörter stimmen nicht überein.");
        } else {
            confirm_password.setCustomValidity('');
        }
    }

    password.onchange = validatePassword;
    confirm_password.onkeyup = validatePassword;
});