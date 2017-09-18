/* eslint-disable no-console */
const permissionsHelper = require('../../permissions');
const moment = require('moment');
const truncatehtml = require('truncate-html');
moment.locale('de');

module.exports = {
    pagination: require('./pagination'),
    ifArray: (item, options) => {
        if(Array.isArray(item)) {
            return options.fn(item);
        } else {
            return options.inverse(item);
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
    truncateHTML: (text = '', {length = 140} = {}) => {
        if (text.length <= length) {
            return text;
        }
        return truncatehtml(text, 140);
    },
    conflictFreeHtml: (text = '') => {
        text = text.replace(/style=["'][^"]*["']/g,'');
        text = text.replace(/<(a).*?>(.*?)<\/(?:\1)>/g,'$2');
        return text;
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
    ifvalue: (conditional, options) => {
        if (options.hash.value === conditional) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    timeFromNow: (date, opts) => {
        return moment(date).fromNow();
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
    log: (data) => {
        console.log(data);
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
    }
};