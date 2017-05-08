var pushManager = {
  requestPermissionCallback: null,

  setRegistrationId: function(id, service, device) {
    //console.log('set registration id: ' + id);

    var deviceToken = "deviceToken=" + id;
    document.cookie = deviceToken + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";

    var cookies = getCookiesMap(document.cookie);
    if (cookies["notificationPermission"])
        sendRegistrationId(id, service, device);
  },

  error: function(error, msg) {
    console.log(msg || 'Push error: ', error);
  },

  handleNotification: function(data) {
    console.log('notification event', data);
  },

  requestPermission: function() {
      document.cookie = "notificationPermission=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
      if (this.requestPermissionCallback) {
      this.requestPermissionCallback();
    }
  },

  registerSuccessfulSetup: function(service, requestPermissionCallback) {
    //console.log('server ', service, ' is set up!');
    this.requestPermissionCallback = requestPermissionCallback;
  }
};

function getCookiesMap(cookiesString) {
    return cookiesString.split(";")
        .map(function(cookieString) {
            return cookieString.trim().split("=");
        })
        .reduce(function(acc, curr) {
            acc[curr[0]] = curr[1];
            return acc;
        }, {});
}