
function getMaxSelectionIndex(){
	return document.querySelector(".stages").childElementCount;
}

function getSelectionIndex(){
    var radioButtons = $('.form input:radio');
	return radioButtons.index(radioButtons.filter(':checked')) + 1;
}

function updateButton(selectedIndex){
    if(selectedIndex == getMaxSelectionIndex()){
        document.querySelector('#nextSection').innerHTML = 'Submit';
    }else{
        document.querySelector('#nextSection').innerHTML = 'Next';
    }

    if(selectedIndex == 1){
        document.querySelector('.form #prevSection').setAttribute("disabled","disabled");
    }else{
        document.querySelector('.form #prevSection').removeAttribute("disabled");
    }
}

function nextSection(){
    
    const selectedIndex = Math.min(getSelectionIndex() + 1, getMaxSelectionIndex());
    document.querySelector('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').checked = true;
	updateButton(selectedIndex);

    /* TODO - submit form when selectedIndex == document.querySelector(".stages").childElementCount */
}

function prevSection() {
    const selectedIndex = getSelectionIndex() - 1;
    document.querySelector('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').checked = true;
    updateButton(selectedIndex);
}
window.addEventListener('load', function() {
    $('.form .stages label').click(function() {
        var stages = $('.form .stages label');
        updateButton(stages.index(this) + 1);
    });
    document.querySelector('.form #prevSection').addEventListener("click", prevSection)
    document.querySelector('.form #nextSection').addEventListener("click", nextSection)

    // TIME Picker
    $.datetimepicker.setLocale('de');
    $('input[data-datetime]').datetimepicker({
        format:'d.m.Y H:i',
        mask: '39.19.9999 29:59'
    });
    $('input[data-date]').datetimepicker({
        format:'d.m.Y',
        mask: '39.19.9999'
    });
});