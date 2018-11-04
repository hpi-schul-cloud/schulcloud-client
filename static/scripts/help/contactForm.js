function initForm(formContainer){
    const adminForm = formContainer.querySelector(".admin_form");
    const teamForm = formContainer.querySelector(".team_form");
    const wishForm = teamForm.querySelector(".wish_form");
    const bugForm = teamForm.querySelector(".bug_form");

    // handle form change when target changes
    formContainer.querySelector("#message_target").addEventListener("change", (event) => {
        if(event.target.value == "admin"){
            adminForm.classList.remove("hidden");
            teamForm.classList.add("hidden");
        }else{
            adminForm.classList.add("hidden");
            teamForm.classList.remove("hidden");
        }
    });

    // handle form change when type changes
    formContainer.querySelector("#message_type").addEventListener("change", (event) => {
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
    //document.querySelectorAll(".contact-form").forEach(initForm);
    document.querySelectorAll(".contact-card .card-content").forEach(initForm);
}


if(!window.contactForm){
    window.contactForm = init;
    window.addEventListener('load', window.contactForm);
}

// accessability radio buttons (keyboard navigation)
document.querySelectorAll("label").forEach((label) => {
    if(!label.getAttribute("for")){return;}
    const input = document.getElementById(label.getAttribute("for"));
    if(!input || input.getAttribute("type") !== "radio"){return;}
    const fieldset = input.closest("fieldset");

    label.addEventListener("keyup", (event) => {
        if(input.getAttribute("disabled") !== null || input.getAttribute("readonly") !== null){
            return true;
        }
        if(event.keyCode !== 32){ // other than spacebar
            return true;
        }
        // check input
        event.preventDefault();
        event.stopPropagation();
        input.checked = true;

        // trigger change event
        if(fieldset){
            const event = new CustomEvent('change', { target: fieldset });
            fieldset.dispatchEvent(event);
        }
    });
});
