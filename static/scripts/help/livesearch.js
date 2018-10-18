import {interpolate} from "../helpers/templatestringVarInterpolate.js";

function truncate(text, length){
    if (text.length <= length) {
        return text;
    }
    const subString = text.substr(0, length-1);
    return subString.substr(0, subString.lastIndexOf(' ')) + "...";
}

// confluence live search
const searchRoot = document.querySelector(".live-search");
const searchResultTemplate = searchRoot.querySelector("template.result").innerHTML;
const searchInput = searchRoot.querySelector("input.search");
const searchResults = searchRoot.querySelector(".live-search-results");
const numberOfResults = 10;

searchInput.addEventListener("input", async () => {
    let resultHtml = "";
    if(searchInput.value.length){
        const result = await fetch(`https://docs.schul-cloud.org/rest/searchv3/1.0/search?queryString=${searchInput.value}&where=SCDOK&type=page&pageSize=${numberOfResults}&highlight=false`, {
            credentials: "same-origin",
            cache: "no-cache"
        }).then((response) => {
            return response.json();
        });
        result.results.forEach((result) => {
            resultHtml += interpolate(searchResultTemplate, {
                id: result.id, 
                title: result.title, 
                short_description: truncate(result.bodyTextHighlights, 100)
            });
        });
    }
    searchResults.innerHTML = resultHtml;
});