
function onFocusChange(activity){
    toast('activity');
}

window.addEventListener('load', function(){
    window.addEventListener('focus', function(){onFocusChange('focus');});
    window.addEventListener('blur', function(){onFocusChange('blur');});
    document.hasFocus() ? onFocusChange('focus') : onFocusChange('blur');
});
