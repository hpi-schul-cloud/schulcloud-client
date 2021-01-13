const settings_current_password = document.querySelector('#settings_current_password');
const passwordNew = document.querySelector('#passwordNew');
const password_control = document.querySelector('#password_control');
const show_Password = document.querySelector('#show_Password');

show_Password.addEventListener('click', function (e) {
    // toggle the type attribute
    const type = settings_current_password.getAttribute('type') === 'password' ? 'text' : 'password';
    settings_current_password.setAttribute('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye-slash');
});
/*function toggle() {
    var temp = document.getElementById("show_Password");
    if (temp.type === "password") {
        temp.type = "text";
    }
    else {
        temp.type = "password";
    }
}*/