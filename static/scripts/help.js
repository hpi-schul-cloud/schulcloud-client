import livesearch from "./helpers/livesearch.js";
import "./help/contactForm.js";


$(document).ready(function () {
    $('.btn-poll').on('click', function (e) {
        e.preventDefault();

        document.cookie = "pollClicked=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
    });
});

// iFrame full height
document.querySelectorAll("iframe").forEach((iframe, index)=>{
    const identifier = "iframe-"+index;
    iframe.dataset.identifier = identifier;
    iframe.addEventListener("load", (event) => {
        iframe.contentWindow.postMessage(JSON.stringify({
            function: "getSize",
            identifier: identifier
        }), '*');
    });
});

window.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if(message.size && message.identifier){
        document.querySelectorAll(`iframe[data-identifier="${message.identifier}"]`).forEach((iframe) => {
            iframe.style.height = message.size.y + 10 + 'px';
        });
    }
}, false);

/* script for iFrame
window.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if(message.function){
        if(message.function === "getSize" && message.identifier){
            window.parent.postMessage(JSON.stringify({
                identifier: message.identifier,
                size: {
                    x: document.body.scrollWidth,
                    y: document.body.scrollHeight
                }
            }), '*');
        }
    }
}, false);
*/

// confluence live-search
function truncate(text, length){
    if (text.length <= length) {
        return text;
    }
    const subString = text.substr(0, length-1);
    return subString.substr(0, subString.lastIndexOf(' ')) + "...";
}

function extractResults(result){
    return result.results;
}

function parseData(result){
    if(result){
        return {
            class: "",
            link: `/help/confluence/${result.id}`,
            title: result.title,
            short_description: truncate(result.bodyTextHighlights, 100)
        };
    } else{
        return {
            class: "disabled",
            link: "#",
            title: "Keine Ergebnisse gefunden 😪",
            short_description: "Probiere es mit anderen Suchbegriffen erneut"
        };
    }
}
const config = {
    url: "https://docs.schul-cloud.org/rest/searchv3/1.0/search?queryString=${inputValue}&where=SCDOK&type=page&pageSize=10&highlight=false",
    extractResultArray: extractResults,
    dataParser: parseData,
    livesearchRootSelector: ".live-search",
    inputSelector: "input.search",
    resultContainerSelector: ".live-search-results"
};
livesearch(config);