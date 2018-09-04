/**
 * INPUT LINKING
 * usage: add the class ".linked" to the input field and the attribute "data-from={inputname}" to the node that should be updated with the value from the input field. {inputname} is the value of the name attribute of the input field.
 */

function updateLinkedElements(event){
    let source = event.target;
    let value;
    switch(source.tagName) {
        case "INPUT":
            value = source.value;
            break;
        case "SELECT":
            if(source.selectedIndex < 0){
                value = '';
            }else{
                if(source.dataset.linktext !== undefined){
                    value = source.options[source.selectedIndex].text;
                } else if(source.dataset.linkhtml !== undefined){
                    value = source.options[source.selectedIndex].innerHTML;
                } else {
                    value = source.options[source.selectedIndex].value;
                }
            }
            break;
        default:
            if(source.dataset.linkhtml !== undefined){
                value = source.innerHTML;
            } else {
                value = source.text;
            }
            break;
    }
    document.querySelectorAll(`*[data-from=${source.getAttribute("name")}]`).forEach((changeTarget)=>{
        if(changeTarget.tagName == "INPUT"){
            changeTarget.value = value;
        }else{
            changeTarget.innerHTML = value;
        }
    });
}
if(!window.inputLinking){
    window.inputLinking = ()=>{
        document.querySelectorAll(".linked").addEventListener("change input keyup paste click", updateLinkedElements);
        document.querySelectorAll(".linked").forEach((node) => {
            node.dispatchEvent(new Event('input'));
        });
    }
    window.addEventListener('DOMContentLoaded', window.inputLinking);
}