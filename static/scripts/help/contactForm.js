

function initForm(form){
    const adminForm = form.querySelector(".admin_form");
    const teamForm = form.querySelector(".team_form");
    const wishForm = teamForm.querySelector(".wish_form");
    const bugForm = teamForm.querySelector(".bug_form");

    // handle form change when target changes
    form.querySelector("#message_target").addEventListener("change", (event) => {
        if(event.target.value == "admin"){
            adminForm.classList.remove("hidden");
            teamForm.classList.add("hidden");
        }else{
            adminForm.classList.add("hidden");
            teamForm.classList.remove("hidden");
        }
    });

    // handle form change when type changes
    form.querySelector("#message_type").addEventListener("change", (event) => {
        if(event.target.value == "wish"){
            wishForm.classList.remove("hidden");
            bugForm.classList.add("hidden");
        }else{
            wishForm.classList.add("hidden");
            bugForm.classList.remove("hidden");
        }
    });
}

function init(){
    document.querySelectorAll(".contact-form").forEach(initForm);
}


if(!window.contactForm){
    window.contactForm = init;
    window.addEventListener('load', window.contactForm);
}