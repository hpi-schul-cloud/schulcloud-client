function copy(event){
    event.preventDefault();
    console.log("click");
    const copySelector = event.target.dataset.copySelector;
    let copySource = document.querySelector(copySelector);
    copySource.select();
    
    document.execCommand("copy");
}
function printInvitation(event){
    event.preventDefault()
    const invitationLink = document.querySelector("#invitationLink").value;
    // create qr code for current page
    w = window.open();
    let body = w.document.querySelector("body");
    const image = kjua({text: invitationLink, render: 'image'});
    body.appendChild(image);
    let linkNode = document.createElement("p");
    linkNode.innerText = invitationLink;
    body.appendChild(linkNode);
    w.print();
    w.close();
}
function initializeCopy(){
    document.querySelectorAll(".copy").forEach((btn) => {
        btn.addEventListener("click", copy);
    });
}

window.addEventListener('DOMContentLoaded', ()=>{
    initializeCopy();
    document.querySelector("#printInvitation").addEventListener("click", printInvitation);
});