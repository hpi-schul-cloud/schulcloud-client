
function copy(event){
    event.preventDefault();
    const copySelector = event.target.dataset.copySelector;
    let copySource = document.querySelector(copySelector);
    copySource.select();
    
    document.execCommand("copy");
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
    console.log(image.parent.textContent);
    w.document.write(`<div><div>${image}</div><p>${invitationLink}</p></div>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
    /* TODO currently the DOM rendering time is to short between creating and printing so the qr-code isn't rendered */
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
        const requestUrl = `/classes/students?classes=${encodeURI(JSON.stringify(selections))}`
        $importModal.modal('hide');
        fetch(requestUrl, {
            credentials: "same-origin"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(students) {
            console.log(students);
            students.forEach(student => {
                document.querySelector(`option[value="${student._id}"]`).selected = true;
            })
            $('select[name="userIds[]"]').trigger("chosen:updated");
        });
    })
});
