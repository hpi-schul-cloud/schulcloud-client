
var CALLBACK_TYPES = {
  RECEIVED: 'received',
  CLICKED: 'clicked'
};

function sendRegistrationId(id, service, device) {
    $.post('/notification/devices', {
        id: id,
        service: service,
        device: device
    }, function(data) {
        $.showNotification("Gerät erfolgreich registriert", "success");
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

function sendClickedCallback(notificationData) {
  var body = {
    notificationId: notificationData.notificationId,
    type: CALLBACK_TYPES.CLICKED
  };

  function callback(response) {
    console.log(response);
  }

  return sendCallback(body, callback);
}

function sendCallback(body, callback) {
    $.post('/notification/callback', {
        body: body
    });
}
