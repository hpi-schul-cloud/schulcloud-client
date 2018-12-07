var CALLBACK_TYPES = {
    RECEIVED: 'received',
    CLICKED: 'clicked',
    READ: 'read'
};

var DEFAULT_HEADERS = {
    'Content-Type': 'application/json'
};

export function sendRegistrationId(id, service, device, type, name, successcb, errorcb) {
    $.post('/notification/devices', {
        id: id,
        service: service,
        device: device,
        type: type,
        name: name
    }, function (data) {
            successcb(data);
    }).fail(function(){
        errorcb();
    });
}

export function removeRegistrationId(id, successcb, errorcb){
 
    $.ajax({
          url: '/notification/device',
          type: 'DELETE',
          success: successcb,
          data: JSON.stringify({id: id}),
          contentType: 'application/json'
        }).fail(function(){errorcb();});
    
}

export function sendShownCallback(notificationData, background, url) {
    var body = {
        notificationId: notificationData.notificationId,
        type: CALLBACK_TYPES.RECEIVED
    };

    function callback(response) {
        console.log(response);
    }

    if (background) {
        var data = JSON.stringify(body);

        return postRequest(url, data, callback);
    }

    return sendCallback(body, callback);
}

export function sendReadCallback(notificationId) {
    var body = {
        notificationId: notificationId,
        type: CALLBACK_TYPES.READ
    };

    function callback(response) {
        console.log(response);
    }

    return sendCallback(body, callback);
}


export function sendClickedCallback(notificationId, background, url) {
    var body = {
        notificationId: notificationId,
        type: CALLBACK_TYPES.CLICKED
    };

    function callback(response) {
        console.log(response);
    }

    if (background) {
        var data = JSON.stringify(body);

        return postRequest(url, data, callback);
    }

    return sendCallback(body, callback);
}

function sendCallback(body, callback) {
    $.post('/notification/callback', body);
}

function postRequest(url, data, callback) {
    if (self.fetch) {
        fetch(url, {
            method: 'POST',
            body: data,
            headers: DEFAULT_HEADERS
        })
            .then(function (response) {
                response.json().then(function (json) {
                    callback(json);
                });
            });
    } else if (self.XMLHttpRequest) {
        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
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
