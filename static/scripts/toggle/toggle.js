function toggle() {
    var temp = document.getElementById("show_Password");
    if (temp.type === "password") {
        temp.type = "text";
    }
    else {
        temp.type = "password";
    }
}