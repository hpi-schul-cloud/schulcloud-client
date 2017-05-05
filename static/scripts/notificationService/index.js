var pushManager = {
  requestPermissionCallback: null,

  setRegistrationId: function(id, service, device) {
    //console.log('set registration id: ' + id);

      // TODO: check for notification granted
    sendRegistrationId(id, service, device);
  },

  error: function(error, msg) {
    console.log(msg || 'Push error: ', error);
  },

  handleNotification: function(data) {
    console.log('notification event', data);
  },

  requestPermission: function() {
    if (this.requestPermissionCallback) {
      this.requestPermissionCallback();
    }
  },

  registerSuccessfulSetup: function(service, requestPermissionCallback) {
    //console.log('server ', service, ' is set up!');
    this.requestPermissionCallback = requestPermissionCallback;
  }
};
