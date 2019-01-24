function loadFile(){                                           
    var file = document.querySelector('#logo-input').files[0]; 
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        transformToBase64(reader.result);
    }, false);
    if (file) {
        reader.readAsDataURL(file);
    }
}
function transformToBase64(image_src){
    var img = new Image();
    var canvas = document.querySelector('#logo-canvas');
    var ctx = canvas.getContext("2d");
    var scalingFactor;
    img.onload = function(){  
        ctx.clearRect(0, 0, canvas.width, canvas.height);                  
        (img.width < img.height) ? scalingFactor = img.height / canvas.height : scalingFactor = img.width / canvas.width;                                                
        ctx.drawImage(img, canvas.width / 2 - img.width / scalingFactor / 2, canvas.height / 2 - img.height / scalingFactor / 2, img.width / scalingFactor, img.height / scalingFactor);
        document.getElementsByName('logo_dataUrl')[0].value = canvas.toDataURL("image/png");
        document.querySelector('#preview-logo').src = canvas.toDataURL("image/png");
        document.querySelector('#logo-filename').innerHTML = 'Datei ausgewählt';
    }
    img.src = image_src;
}     

document.querySelector('#logo-input').addEventListener("change", loadFile, false);

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("rss-feeds-add").onclick=function(e){
        e.preventDefault()

        const formGroup = document.createElement("div")
        formGroup.className = "form-group"
        
        const node = document.createElement("div")
        node.className="input-group"
        
        const input = document.createElement("input")
        input.type = "url"
        input.className = "form-control"
        input.name = "feeds"
        input.required = true

        const group = document.createElement("div")
        group.className = "input-group-btn"

        const button = document.createElement("button")
        button.className = "btn btn-outline-primary btn-rss-delete"
        button.type = "button"
        button.onclick = () => button.parentNode.parentNode.remove()

        const icon = document.createElement("i")
        icon.className = "fa fa-trash-o"

        button.append(icon)
        group.append(button)
        node.append(input)
        node.append(group)
        formGroup.append(node)
       
        this.parentNode.insertBefore(formGroup,this)
    }
    Array.from(document.getElementsByClassName("btn-rss-delete")).forEach(el=>{
        el.onclick=()=>{
            el.parentNode.parentNode.remove()
            const feeds = document.getElementById("rss-feeds")
            if (!feeds.querySelectorAll("input").length){
                const input = document.createElement("input")
                input.type = "hidden"
                input.name = "feeds"
                input.value = ""
                feeds.append(input)
            }
        }
    })
})