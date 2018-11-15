export function getQueryParameters(url) {
    if (!url) {
        url = window.location.href;
    }
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

export function getQueryParameterByName(name, url) {
    /* TODO: refactor - use getQueryParameters(url) for better maintainability */
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function updateQueryStringParameter(key, value, url) {
    /* url can be the url that should be updated 
        or true/false/undefined to use the current location.
            If true, the current Browser URL will be updated with pushState
    */
    let handleUrlUpdate = false;
    if(url === true){
        handleUrlUpdate = true;
    }
    if(typeof url !== "string"){
        url = window.location.href;
    }
    var re = new RegExp("([?&])" + key + "=[^&#]*", "i");
    if (re.test(url)) {
        url = url.replace(re, '$1' + key + "=" + value);
    } else {
        var matchData = url.match(/^([^#]*)(#.*)?$/);
        var separator = /\?/.test(url) ? "&" : "?";
        url = matchData[0] + separator + key + "=" + value + (matchData[1] || '');
    }
    if(handleUrlUpdate){
        window.history.replaceState({}, "", url);
    }
    return url;
}