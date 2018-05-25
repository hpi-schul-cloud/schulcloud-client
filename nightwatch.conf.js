//require('env2')('.env'); // optionally store your Evironment Variables in .env
const seleniumServer = require("selenium-server");
const chromedriver = require("chromedriver");
const geckodriver = require("geckodriver");
const path = require('path');
const SCREENSHOT_PATH = path.join(__dirname, "/screenshots/");

// we use a nightwatch.conf.js file so we can include comments and helper functions
module.exports = {
    "src_folders" : ["test/nightwatch"],
    "output_folder" : "./reports",
    "custom_commands_path" : "",
    "custom_assertions_path" : "",
    "page_objects_path" : "",
    "globals_path" : "",

    "selenium" : {
        "start_process" : true,
        "server_path" : seleniumServer.path,
        "log_path" : "",
        "port" : 4444,
        "cli_args" : {
            "webdriver.chrome.driver" : chromedriver.path,
            "webdriver.gecko.driver" : geckodriver.path
        }
    },

    "test_settings" : {
        "default" : {
            "selenium_port"  : 4444,
            "selenium_host"  : "localhost",
            "silent": true,
            "screenshots" : {
                "enabled" : true,
                "on_failure": true,
                "on_error": true,
                "path" : SCREENSHOT_PATH
            },
            "globals": {
                "waitForConditionTimeout": 20000
            },
            "desiredCapabilities": {
                "browserName": "chrome"
            }
        },

        "chrome" : {
            "desiredCapabilities": {
                "browserName": "chrome",
                "javascriptEnabled": true
            }
        },

        "firefox" : {
            "desiredCapabilities": {
                "browserName": "firefox",
                "javascriptEnabled": true
            }
        }
    }
};

function padLeft(count) { // theregister.co.uk/2016/03/23/npm_left_pad_chaos/
    return count < 10 ? '0' + count : count.toString();
}

let FILECOUNT = 0; // "global" screenshot file count
/**
 * The default is to save screenshots to the root of your project even though
 * there is a screenshots path in the config object above! ... so we need a
 * function that returns the correct path for storing our screenshots.
 * While we're at it, we are adding some meta-data to the filename, specifically
 * the Platform/Browser where the test was run and the test (file) name.
 */
function imgpath(browser) {
    let a = browser.options.desiredCapabilities;
    let meta = [a.platform];
    meta.push(a.browserName ? a.browserName : 'any');
    meta.push(a.version ? a.version : 'any');
    meta.push(a.name); // this is the test filename so always exists.
    let metadata = meta.join('~').toLowerCase().replace(/ /g, '');
    return SCREENSHOT_PATH + metadata + '_' + padLeft(FILECOUNT++) + '_';
}

module.exports.imgpath = imgpath;
module.exports.SCREENSHOT_PATH = SCREENSHOT_PATH;
