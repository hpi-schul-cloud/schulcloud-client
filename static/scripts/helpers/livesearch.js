import {interpolate} from "../helpers/templatestringVarInterpolate.js";

const defaultConfig = {
    url: undefined, // variables: inputValue
    dataParser: undefined,
    livesearchRootSelector: ".livesearch",
    inputSelector: "input",
    resultTemplateSelector: "template.result",
    resultContainerSelector: ".livesearch-result",
};

// confluence live search
export default function init(config){
    // override default config with user settings
    config = Object.assign(defaultConfig, config);

    const livesearchRoot = document.querySelector(config.livesearchRootSelector);
    const input = livesearchRoot.querySelector(config.inputSelector);
    const livesearchResultTemplateString = livesearchRoot.querySelector(config.resultTemplateSelector).innerHTML;
    const livesearchResultContainer = livesearchRoot.querySelector(config.resultContainerSelector);

    input.addEventListener("input", async () => {
        let resultHtml = "";
        if(input.value.length){
            const result = await fetch(interpolate(config.url, {
                    inputValue: input.value
                }), {
                    credentials: "same-origin",
                    cache: "no-cache"
                }).then((response) => {
                    return response.json();
                });
            result.results.forEach((result) => {
                resultHtml += interpolate(livesearchResultTemplateString, config.dataParser(result));
            });
        }
        livesearchResultContainer.innerHTML = resultHtml;
    });
}