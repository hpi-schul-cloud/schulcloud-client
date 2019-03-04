function loadFile() {
    var file = document.querySelector('#logo-input').files[0];
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        transformToBase64(reader.result);
    }, false);
    if (file) {
        reader.readAsDataURL(file);
    }
}
function transformToBase64(image_src) {
    var img = new Image();
    var canvas = document.querySelector('#logo-canvas');
    var ctx = canvas.getContext("2d");
    var scalingFactor;
    img.onload = function () {
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