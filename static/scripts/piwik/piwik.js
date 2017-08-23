var _paq = _paq || [];
$.get('/account/user', (res) => {
    if (typeof (res || {}).firstName === 'string') {
        _paq.push(['setCustomDimension', customDimensionId = 1, customDimensionValue = res.schoolName]);
        _paq.push(['setCustomDimension', customDimensionId = 2, customDimensionValue = res.gender]);
        _paq.push(['setCustomDimension', customDimensionId = 4, customDimensionValue = res.roles[0].name]);
    }

    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
});

(function () {
    var u = "//open.hpi.de/piwik/";
    _paq.push(['setTrackerUrl', u + 'piwik.php']);
    _paq.push(['setSiteId', '8']);
    var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
    g.type = 'text/javascript';
    g.async = true;
    g.defer = true;
    g.src = u + 'piwik.js';
    s.parentNode.insertBefore(g, s);
})();
