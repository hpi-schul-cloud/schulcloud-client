
var CALLBACK_TYPES = {
  RECEIVED: 'received',
  CLICKED: 'clicked'
};

function sendRegistrationId(id, service, device) {
        $.post('/notification/devices', {
            id: id,
            service: service,
            device: device
        }, function (data) {
            // Register notification permission cookie
            document.cookie = "notificationPermission=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
        });
}

function sendShownCallback(notificationData) {
  var body = {
    notificationId: notificationData.notificationId,
    type: CALLBACK_TYPES.RECEIVED
  };

  function callback(response) {
    console.log(response);
  }

  return sendCallback(body, callback);
}

// Not used due to restrictions of context sharing
/**
function sendClickedCallback(notificationData) {
  var body = {
    notificationId: notificationData.notificationId,
    type: CALLBACK_TYPES.CLICKED
  };

  function callback(response) {
    console.log(response);
  }

  return sendCallback(body, callback);
}**/

function sendCallback(body, callback) {
    $.post('/notification/callback', {
        body: body
    });
}

