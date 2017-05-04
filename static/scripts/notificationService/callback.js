
var CALLBACK_TYPES = {
  RECEIVED: 'received',
  CLICKED: 'clicked'
};
var DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'token': $('input:hidden[name=userId]').val()
};
var SERVER_URL = 'http://localhost:3031'; //Change to appropriate URL

function sendRegistrationId(id, service, device) {
  var url = SERVER_URL + '/devices';
  var body = {
    "service": service ? service : "firebase",
    "type": "mobile",
    "name": "test2",
    "token": $('input:hidden[name=userId]').val(),
    "device_token": id,
    "OS": device ? device : "android7"
  };
  var data = JSON.stringify(body);

  function callback(response) {
    console.log(response);
  }

  postRequest(url, data, callback);
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
  var url = SERVER_URL + '/callback';
  var data = JSON.stringify(body);

  postRequest(url, data, callback);
}

function postRequest(url, data, callback) {
  if (self.fetch) {
    fetch(url, {
      method: 'POST',
      body: data,
      headers: DEFAULT_HEADERS
    })
      .then(function(response) {
        response.json().then(function(json) {
          callback(json);
        });
      });
  } else if (self.XMLHttpRequest) {
    var xhttp;
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 201) {
        var response = JSON.parse(xhttp.responseText);
        callback(response);
      }
    };
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader("Content-type", DEFAULT_HEADERS['Content-Type']);
    xhttp.send(data);
  } else {
    console.log('No way to send out', data);
  }
}
