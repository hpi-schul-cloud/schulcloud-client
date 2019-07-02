function copy(event){
    event.preventDefault();
    const copySelector = event.target.dataset.copySelector;
    let copySource = document.querySelector(copySelector);
    copySource.select();
    document.execCommand("copy");
    $.showNotification("Der Link wurde in deine Zwischenablage kopiert", "success", 3000);
}
function initializeCopy(){
    document.querySelectorAll(".copy").forEach((btn) => {
        btn.addEventListener("click", copy);
    });
}

function printInvitation(event){
    event.preventDefault()
    const invitationLink = document.querySelector("#invitationLink").value;
    // create qr code for current page
    let w = window.open();
    const image = kjua({text: invitationLink, render: 'image'});
    w.document.write(`<style>
        @page {size: A4; margin: 16px;}
        .part{ border: 1px solid #999; width: 110px; float: left; padding: 8px; margin: 4px;}
        img{width: 100% !important; height: auto !important;}
        p{font-size: 10px; color: #555; margin: 8px 0 0; text-align: center; word-break: break-all;}
    </style>`);
    for(let i = 0; i < 30; i++) {
        w.document.write(`<div class="part"><div class="image-wrapper"></div><p>${invitationLink}</p></div>`);
    }
    w.document.querySelectorAll('.image-wrapper').forEach((imageWrapper) => {
        imageWrapper.appendChild(image.cloneNode(true));
    });
    w.document.close();
    /* eventListener is needed to give the browser some rendering time for the image */
    w.addEventListener('load', () => {
        w.focus();
        w.print();
        w.close();
    });
}

function createInvitationLink(){
    let target = 'registration/' + $("input[name='classid']").val();
    $.ajax({
        type: "POST",
        url: "/link/",
        data: {
            target: target
        },
        success: function(data) {
            $("#invitationLink").val(data.newUrl);
        }
    });
}

function printInvitations (users) {
    event.preventDefault();
    let w = window.open();
    w.document.write(`<style>
    @page {size: A4; margin: 16px;}
    .part{ border: 1px solid #999; width: 110px; float: left; padding: 8px; margin: 4px;}
    img{width: 100% !important; height: auto !important;}
    p{font-size: 10px; color: #555; min-height: 26px; margin: 8px 0 0; text-align: center; word-break: break-all;}
    </style>`);
    for (let user of users) {
        const image = kjua({text: user.registrationLink.shortLink, render: 'image'});
        w.document.write(`<div class="part">
                            <div class="image-wrapper" id="user-${user._id}"></div>
                            <h4 style="margin-bottom: 10px">${user.displayName}</h4>
                            <p>${user.registrationLink.shortLink}</p>
                        </div>`);
        w.document.querySelector('#user-' + user._id).appendChild(image.cloneNode(true));
    }

    w.document.close();
    /* eventListener is needed to give the browser some rendering time for the image */
    w.addEventListener('load', () => {
        w.focus();
        w.print();
        w.close();
    });
}

window.addEventListener('DOMContentLoaded', ()=>{
    initializeCopy();
    document.querySelector("#printInvitation").addEventListener("click", printInvitation);
    createInvitationLink();
});

window.addEventListener('load', ()=>{
    document.getElementById("filter_schoolyear").addEventListener("input", async (event)=>{
        // get filtered classes
        const yearId = event.target.value;
        const res = await fetch(`/administration/classes/json?yearId=${yearId}`, {credentials: "same-origin"});
        const classes = await res.json();
        const classInput = document.getElementById("student_from_class_import");

        // update items
        if(classes.total === 0){
            classInput.innerHTML = `<option value="" disabled>Keine Klassen in diesem Jahrgang vorhanden</option>`;
        }else{
            classInput.innerHTML = `${classes.data.map((item, i) => `
                <option value="${item._id}">${item.displayName}</option>
            `).join('')}`;
        }
        $('select[name="classes"]').trigger("chosen:updated");
    });


    let $importModal = $('.import-modal');

    $('.btn-import-class').on('click', (event) => {
        event.preventDefault();
        document.querySelectorAll(`select[name="classes"] option`).forEach(option => { option.selected = false });
        $('select[name="classes"]').trigger("chosen:updated");
        populateModalForm($importModal, {
            title: 'Klasse importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $importModal.appendTo('body').modal('show');
    });

    $('.btn-skip-consent').on('click', function (e) {
        e.preventDefault();
        var newForm = $('<form id="newForm" action="' + window.location.origin + '/administration/classes/' + $(this).data('class') + '/skipregistration" method="POST"></form>');
        $('body').append(newForm);
        newForm.submit();
        
    });

    $importModal.find('.btn-submit').on('click', async (event) => {
        event.preventDefault();
        const selections = $("#student_from_class_import").chosen().val();
        const requestUrl = `/administration/classes/students?classes=${encodeURI(JSON.stringify(selections))}`;
        $importModal.modal('hide');
        const res = await fetch(requestUrl, {
            credentials: "same-origin"
        })
        const students = await res.json();
        students.forEach(student => {
            document.querySelector(`option[value="${student._id}"]`).selected = true;
        });
        sortStudents();
        $("select[name=userIds]").trigger("chosen:updated");
    });

    $('.btn-send-links-emails').on('click', function (e) {
        e.preventDefault();
        const $this = $(this);
        const text = $this.html();
        const classId = $this.data('class');

        $this.html('E-Mails werden gesendet...');
        $this.attr("disabled", "disabled");

        $.ajax({
            type: "GET",
            url: window.location.origin+"/administration/users-without-consent/send-email",
            data: {
                classId
            }
        }).done(function(data) {
            $.showNotification('Erinnerungs-E-Mails erfolgreich versendet', "success", true);
            $this.attr("disabled", false);
            $this.html(text);
        }).fail(function (data) {
            $.showNotification('Fehler beim senden der Erinnerungs-E-Mails', "danger", true);
            $this.attr("disabled", false);
            $this.html(text);
        });
    });

    $('.btn-print-links').on('click', function (e) {
        e.preventDefault();
        const $this = $(this);
        const text  = $this.html();
        const classId = $this.data('class');

        $this.html('Druckbogen wird generiert...');
        $this.attr("disabled", "disabled");

        $.ajax({
            type: "GET",
            url: window.location.origin+"/administration/users-without-consent/get-json",
            data: {
                classId
            }
        }).done(function(users) {
            printInvitations(users);
            $.showNotification('Druckbogen erfolgreich generiert', "success", true);
            $this.attr("disabled", false);
            $this.html(text);
        }).fail(function (data) {
            $.showNotification('Problem beim Erstellen des Druckbogens', "danger", true);
            $this.attr("disabled", false);
            $this.html(text);
        });
    });    
});

function sortOptions(selector, sortFunction){
    const input = document.querySelector(selector);
    let options = Array.from(input.querySelectorAll('option'));

    options.sort(sortFunction);
    options.forEach(option => {
        input.appendChild(option);
    });
}

function sortStudents(){
    const sortFunction = (a, b) => {
        const a_value = a.dataset.lastName;
        const b_value = b.dataset.lastName;
        if (a_value < b_value) {
            return -1;
        }
        if (a_value > b_value) {
            return 1;
        }
        return 0;
    };

    const studentInputSelector = "select[name=userIds]";
    sortOptions(studentInputSelector, sortFunction);
    $(studentInputSelector).trigger("chosen:updated");
}
window.addEventListener("load", sortStudents);
