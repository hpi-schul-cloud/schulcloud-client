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
    w.document.write(`<div><div id="image-wrapper"></div><p>${invitationLink}</p></div>`);
    w.document.getElementById('image-wrapper').appendChild(image);
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
    var $importModal = $('.import-modal');
    $('.btn-import-class').on('click', (event) => {
        event.preventDefault();
        document.querySelectorAll(`select[name="classes"] option`).forEach(option => { console.log(option); option.selected = false });
        $('select[name="classes"]').trigger("chosen:updated");
        populateModalForm($importModal, {
            title: 'Klasse importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $importModal.appendTo('body').modal('show');
    });
    $importModal.find('.btn-submit').on('click', (event) => {
        event.preventDefault();
        const selections = [...document.querySelector('select[name="classes"]').options].filter(option => option.selected).map(option => option.value);
        const requestUrl = `/administration/classes/students?classes=${encodeURI(JSON.stringify(selections))}`
        $importModal.modal('hide');
        fetch(requestUrl, {
            credentials: "same-origin"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(students) {
            students.forEach(student => {
                document.querySelector(`option[value="${student._id}"]`).selected = true;
            })
            $('select[name="userIds[]"]').trigger("chosen:updated");
        });
    })
});
