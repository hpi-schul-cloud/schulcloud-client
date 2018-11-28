// src: https://jsfiddle.net/w3jx07vt/

function Prop(obj,is,value) {
    if (typeof is == 'string')
        is=is.split('.');
    if (is.length==1 && value!==undefined)
        return obj[is[0]] = value;
    else if (is.length==0)
        return obj;
    else{
        var prop=is.shift();
        if(value!==undefined&&obj[prop]==undefined)obj[prop]={}
        return Prop(obj[prop],is, value);
    }
}

export function interpolate(template, data){
    return template.replace(/\$\{(.+?)\}/g,(match, p1)=>{
        return Prop(data,p1);
    });
}