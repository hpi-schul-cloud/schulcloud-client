// Author: Hannes Schurig, 25.04.2018
// Tested in Windows 10 Chrome 66, Firefox 59, Opera 52, IE 11

// Browser ES Support Check from https://stackoverflow.com/a/29046739
function checkBrowserEsSupport() {
    "use strict";

    if (typeof Symbol == "undefined") return false;
    try {
        eval("class Foo {}");
        eval("var bar = (x) => x+1");
    } catch (e) { return false; }

    return true;
}

if (checkBrowserEsSupport()) {
    // ES6 Browser, use better ES6 version of the player
    var s1 = document.createElement('script');
    s1.src = "/scripts/video-player/webcomponents-lite.js";
    document.head.appendChild(s1);
    var page_es6 = document.createElement('link');
    page_es6.href = "/vendor/video-player/video-player-es6.html";
    page_es6.rel = "import";
    document.head.appendChild(page_es6);
} else {
    // ES5 Browser, user slower ES5 compatible version of the player
    for (scriptsrc in arr=["/vendor/webcomponents-lite.js", "/scripts/video-player/custom-elements-es5-adapter.js","/scripts/video-player/polyfills-ie.js"]) {
        var a = document.createElement('script');
        a.src = arr[scriptsrc];
        document.head.appendChild(a);
    }
    var page_es5 = document.createElement('link');
    page_es5.href = "/vendor/video-player/video-player-es5.html";
    page_es5.rel = "import";
    document.head.appendChild(page_es5);
}
//TODO: Test in Windows 7 Internet Explorer, might fail because it's not supported by the player
//TODO: Internet Explorer video is loading very slow