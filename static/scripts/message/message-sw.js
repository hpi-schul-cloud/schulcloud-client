import {pushManager} from './../notificationService/index';

const messagingSW = {

    _clientFocused: false,

    setupMessaging() {
        const that = this;
        self.addEventListener('message', function (event) {
            if (event.data && event.data.tag) {
                switch (event.data.tag) {
                    case 'client-focus-change':
                        if (event.data.data.activity === 'focus') {
                            that._clientFocused = true;
                        } else {
                            that._clientFocused = false;
                        }
                        console.log('client-focus-change:', event.data.data.activity);
                        break;
                }
            }
        });

        self.addEventListener('push', function (event) {
            const message = event.data.json();
            
            // mark message notification as seen if any client is focused
            if(message.notification){
                message.notification.shown = that._clientFocused;
            }

            const pChain = [];

            // send message for visible toast or action to client
            pChain.push(self.clients.matchAll().then(clients => {
                return clients.map(client => client.postMessage(message));
            }).then(clients => Promise.all(clients)));

            // handle message in sw
            pChain.push(pushManager.handleNotification(self.registration, message));

            event.waitUntil(pChain);

        });
    },



};

module.exports = messagingSW;
