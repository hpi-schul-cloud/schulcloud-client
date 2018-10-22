/* eslint-disable no-console */
const permissionsHelper = require('../../permissions');
const moment = require('moment');
const truncatehtml = require('truncate-html');
const stripHtml = require('string-strip-html');
moment.locale('de');

function ifCondBool (v1, operator, v2) {
    switch (operator) {
        case '==':
            return (v1 == v2);
        case '===':
            return (v1 === v2);
        case '!=':
            return (v1 != v2);
        case '!==':
            return (v1 !== v2);
        case '<':
            return (v1 < v2);
        case '<=':
            return (v1 <= v2);
        case '>':
            return (v1 > v2);
        case '>=':
            return (v1 >= v2);
        case '&&':
            return (v1 && v2);
        case '||':
            return (v1 || v2);
        case '|| !':
            return (v1 || !v2);
        default:
            return false;
    }
}

module.exports = {
    pagination: require('./pagination'),
    ifArray: (item, options) => {
        if(Array.isArray(item)) {
            return options.fn(item);
        } else {
            return options.inverse(item);
        }
    },
    inArray: (item, array, opts) => {
        if(array.includes(item)){
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    },
    arrayLength: (array) => {
        return array.length;
    },
    truncate: (text = '', {length = 140} = {}) => {
        if (text.length <= length) {
            return text;
        }
        const subString = text.substr(0, length-1);
        return subString.substr(0, subString.lastIndexOf(' ')) + "...";
    },
    truncatePure: (text = '', length = 140) => {
        if (text.length <= length) {
            return text;
        }
        const subString = text.substr(0, length-1);
        return subString + "...";
    },
    truncateHTML: (text = '', {length = 140} = {}) => {
        return truncatehtml(text, length, {
          stripTags: true,
          decodeEntities: true,
        });
    },
    truncateLength: (text = '', length = 140) => {
        if (text.length <= length) {
            return text;
        }
        const subString = text.substr(0, length);
        return ((subString.indexOf(" ")>-1)? subString.substr(0, subString.lastIndexOf(' ')) : subString )+ "...";
    },
    truncateArray: (rawArray = [], length = 0) => {
        let truncatedArray = rawArray;
        if(length > 0 && length <= truncatedArray.length) {
            truncatedArray.length=length;
        }
        return truncatedArray;
    },
    stripHTMLTags: (htmlText = '') => {
        return stripHtml(htmlText);
    },
    stripOnlyScript: (htmlText = '') => {
      return stripHtml(htmlText, {onlyStripTags: ['script', 'style']});
    },
    conflictFreeHtml: (text = '') => {
        text = text.replace(/style=["'][^"]*["']/g,'');
        text = text.replace(/<(a).*?>(.*?)<\/(?:\1)>/g,'$2');
        return text;
    },
    
    ifCond: (v1, operator, v2, options) => {
        return ifCondBool(v1, operator, v2) ? options.fn(this) : options.inverse(this);
    },
    isCond: (v1, operator, v2, options) => {
        return ifCondBool(v1, operator, v2);
    },
    ifeq: (a, b, opts) => {
        if (a == b) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    },
    ifneq: (a, b, opts) => {
        if (a !== b) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    },
    ifvalue: (conditional, options) => {
        if (options.hash.value === conditional) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    ifEnv: (env_variable, value, options) => {
        if (process.env[env_variable] == value) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    unlessEnv: (env_variable, value, options) => {
        if (process.env[env_variable] == value) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    },
    userHasPermission: (permission, opts) => {
        if (permissionsHelper.userHasPermission(opts.data.local.currentUser, permission)) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    },
    userIsAllowedToViewContent: (isNonOerContent = false, options) => {
        // Always allow nonOer content, otherwise check user is allowed to view nonOer content
        if(permissionsHelper.userHasPermission(options.data.local.currentUser, "CONTENT_NON_OER_VIEW") || !isNonOerContent) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    timeFromNow: (date, opts) => {
        return moment(date).fromNow();
    },
    datePickerTodayMinus: (years, months, days, format) => {
        if(typeof(format) !== "string"){
            format = "YYYY.MM.DD";
        }
        return moment()
            .subtract(years, 'years')
            .subtract(months, 'months')
            .subtract(days, 'days')
            .format(format);
    },
    dateToPicker: (date, opts) => {
        return moment(date).format('DD.MM.YYYY');
    },
    dateTimeToPicker: (date, opts) => {
        return moment(date).format('DD.MM.YYYY HH:mm');
    },
    timeToString: (date, opts) => {
        let now = moment();
        let d = moment(date);
        if (d.diff(now) < 0 || d.diff(now, 'days') > 5) {
            return moment(date).format('DD.MM.YYYY') + "("+moment(date).format('HH:mm')+")";
        } else {
            return moment(date).fromNow();
        }
    },
    concat: function(){
        var arg = Array.prototype.slice.call(arguments,0);
        arg.pop();
        return arg.join('');
    },
    log: (data) => {
        console.log(data);
    },
    castStatusCodeToString: (statusCode) => {
        console.log(statusCode);
        if(statusCode >= 500){
            return "Ups, da haben wir wohl ein internes Problem. Probier es gleich nochmal.";
        }
        if(statusCode >= 400){
            switch (statusCode){
                case 400:
                    return "Diese Anfrage war fehlerhaft.";
                case 401:
                    return "Bitte Authentifiziere dich zunächst.";
                case 402:
                    return "Diese Funktion musst du erst noch bezahlen.";
                case 403:
                    return "Sorry, aber das dürfen wir dir wirklich nicht zeigen!";
                case 404:
                    return "Ups, diese Seite gibt's wohl nicht.";
            }
        }
        if(statusCode > 300){
            return "Diese Seite wurde verschoben.";
        }
        return "Da ist wohl etwas schief gelaufen!";
    },
    writeFileSizePretty: (fileSize) => {
        let unit;
        let iterator = 0;

        while (fileSize > 1024) {
            fileSize = Math.round((fileSize / 1024) * 100) / 100;
            iterator++;
        }
        switch (iterator) {
            case 0:
                unit = "B";
                break;
            case 1:
                unit = "KB";
                break;
            case 2:
                unit = "MB";
                break;
            case 3:
                unit = "GB";
                break;
            case 4:
                unit = "TB";
                break;
        }
        return (fileSize + ' ' + unit);
    },
    json: (data) => {
        return JSON.stringify(data);
    },
    times: (n, block)=>{
        var accum = '';
        for(var i = 0; i < n; ++i){
            accum += block.fn(i);
        }
        return accum;
    },
    for: (from, to, incr, block) => {
        var accum = '';
        for(var i = from; i < to; i += incr){
            accum += block.fn(i);
        }
        return accum;
    },
    add: (a, b) => {
        return a + b;
    },
    set: (varName, varValue, options) => {
        options.data.root[varName] = varValue;
    },
    inc: (varName, incrementor, options) => {
        if(!options){
            options = incrementor;
            incrementor = 1;
        }
        options.data.root[varName] += incrementor;
    },
};
