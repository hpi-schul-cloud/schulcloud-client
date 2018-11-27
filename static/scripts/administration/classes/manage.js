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


    var $importModal = $('.import-modal');
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
        })
        sortStudents();
        $("select[name=userIds]").trigger("chosen:updated");
    })
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
