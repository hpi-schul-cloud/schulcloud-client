export function updateQueryStringParam(key, value) {
    // src: https://gist.github.com/excalq/2961415
    const baseUrl = `${location.protocol}//${location.host}${location.pathname}`;
    const urlQueryString = document.location.search;
    let newParam = key + '=' + value,
    params = '?' + newParam;
  
    if (urlQueryString) {
        const keyRegex = new RegExp(`([\?&])${key}[^&]*`);
        if (urlQueryString.match(keyRegex) !== null) {
            params = urlQueryString.replace(keyRegex, "$1" + newParam);
        } else {
            params = urlQueryString + '&' + newParam;
        }
    }
    window.history.replaceState({}, "", baseUrl + params + location.hash);
    return baseUrl + params;
}