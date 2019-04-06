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
    const arr = ["/vendor/webcomponents-bundle.js", "/vendor-optimized/video-player/es6/video-player.js"];
    for (let scriptsrc in arr) {
        var a = document.createElement('script');
        a.src = arr[scriptsrc];
        document.head.appendChild(a);
    }

} else {
    // ES5 Browser, user slower ES5 compatible version of the player
    const arr = ["/vendor/webcomponents-bundle.js", "/vendor-optimized/video-player/es5/video-player.js", "/vendor-optimized/video-player/es5/custom-elements-es5-adapter.js","/vendor-optimized/video-player/es5/polyfills-ie.js"];
    for (let scriptsrc in arr) {
        var a = document.createElement('script');
        a.src = arr[scriptsrc];
        document.head.appendChild(a);
    }
}
//TODO: Test in Windows 7 Internet Explorer, might fail because it's not supported by the player
//TODO: Internet Explorer video is loading very slow