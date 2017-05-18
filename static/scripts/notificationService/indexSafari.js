window.onload = function() {
  // Ensure that the user can receive Safari Push Notifications.
  if ('safari' in window && 'pushNotification' in window.safari) {
    var permissionData = window.safari.pushNotification.permission('web.org.schul-cloud');
    checkRemotePermission(permissionData);
  }
};

var checkRemotePermission = function(permissionData) {
  if (permissionData.permission === 'default') {
    console.log('[INFO] Requesting permission...');
    // This is a new web service URL and its validity is unknown.
    window.safari.pushNotification.requestPermission(
      'https://schul-cloud.org:3030', // The web service URL.
      'web.org.schul-cloud',     // The Website Push ID.
      {userToken: 'usertokenwithmin16chars'}, // Data that you choose to send to your server to help you identify the user.
      checkRemotePermission         // The callback function.
    );
  }
  else if (permissionData.permission === 'denied') {
    // The user said no.
    console.log('[INFO] Permission denied.');
  }
  else if (permissionData.permission === 'granted') {
    // The web service URL is a valid push provider, and the user said yes.
    // permissionData.deviceToken is now available to use.
    console.log('[INFO] Permission granted. Token:', permissionData.deviceToken);
    pushManager.setRegistrationId(permissionData.deviceToken, 'apn', 'safari');
  }
  console.log('[INFO] Permission data:', permissionData);
};
