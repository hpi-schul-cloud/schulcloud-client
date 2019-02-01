import { sendRegistrationId, removeRegistrationId } from './callback';
import { notificationHandler } from './notificationHandler';

export const pushManager = {
    requestPermissionCallback: null,
    handledMessages:[],

    setRegistrationId: function (id, service, successCallback, errorCallback) {
        console.log('set registration id: ' + id);

        var deviceToken = "deviceToken=" + id;
        document.cookie = deviceToken + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";

        var device = navigator.platform;
        var type = isMobile() ? 'mobile' : 'desktop';
        var name = browser();
        
        var cookies = getCookiesMap(document.cookie);
        if (cookies["notificationPermission"])
            sendRegistrationId(id, service, device, type, name, successCallback, errorCallback);
    },

    error: function (error, msg) {
        console.log(msg || 'Push error: ', error);
    },

    handleNotification: function (registration, data) {
        if(this.handledMessages.includes(data.data._id) === false){
            //this.handledMessages.push(data.data._id);
            while(this.handledMessages.length>100){
                this.handledMessages.shift();
            }
            console.log('notification event arrived in pushManager', data);
            return notificationHandler.handle(registration, data);
            //sendShownCallback(data);
        }else{
            console.log('ignore push duplicate', data);
            return Promise.resolve('push duplicate');
        }
    },

    requestPermission: function () {
        document.cookie = "notificationPermission=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        if (this.requestPermissionCallback) {
            this.requestPermissionCallback(); // async, without promise
            setTimeout(function () { window.location.reload(); }, 2000);
        }
    },

    registerSuccessfulSetup: function (service, requestPermissionCallback) {
        //console.log('server ', service, ' is set up!');
        this.requestPermissionCallback = requestPermissionCallback;
    },

    removePermission: function(){
        document.cookie = "notificationPermission=false; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
    },

    permissionGranted: function(grantedcb, errorcb){
        var cookies = getCookiesMap(document.cookie);
        if (cookies["notificationPermission"])
            grantedcb();
            else
            errorcb();
    }

};


export const getCookiesMap = (cookiesString) => {
    return cookiesString.split(";")
        .map(function (cookieString) {
            return cookieString.trim().split("=");
        })
        .reduce(function (acc, curr) {
            acc[curr[0]] = curr[1];
            return acc;
        }, {});
};

/**
 * Gets the browser name or returns an empty string if unknown.
 * This function also caches the result to provide for any
 * future calls this function has.
 *
 * @returns {string}
 */
const browser = () => {
    // Return cached result if avalible, else get result then cache it.
    if (browser.prototype._cachedResult)
        return browser.prototype._cachedResult;

    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
        return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || safari.pushNotification);

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    return browser.prototype._cachedResult =
        isOpera ? 'Opera' :
            isFirefox ? 'Firefox' :
                isSafari ? 'Safari' :
                    isChrome ? 'Chrome' :
                        isIE ? 'IE' :
                            isEdge ? 'Edge' :
                                "Don't know";
};

const isMobile = () => {
    try { document.createEvent("TouchEvent"); return true; }
    catch (e) { return false; }
};
