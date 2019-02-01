//import toast from './../toasts';

const messageClient = {

    _registration: null,

    setupMessagingClient(registration) {

        if(!('serviceWorker' in navigator)) {
            console.error('serviceWorker not supported!');
            return;
        }

        this._registration = registration;

        const that = this;

        window.addEventListener('focus', function () { that.onFocusChange('focus'); });
        window.addEventListener('blur', function () { that.onFocusChange('blur'); });
        document.hasFocus() ? that.onFocusChange('focus') : that.onFocusChange('blur');

        navigator.serviceWorker.addEventListener('message', function(event){
            console.log('client received:', event.data);
            if(event.data.notification && event.data.notification.shown){
                iziToast.show({
                    title: event.data.notification.title,
                    message: event.data.notification.body
                });
            }
        });
    },

    onFocusChange(activity) {
        // if(this.registration){
        //     this.registration.showNotification(activity);
        // }
        this.updateRegistration(activity);
    },

    updateRegistration(activity){
        if(this.serviceWorkerEnabled()){
            navigator.serviceWorker.controller.postMessage({
                tag: 'client-focus-change',
                data: {
                    activity
                }
            });
        }
    },

    serviceWorkerEnabled (){
        if(!(navigator.serviceWorker && navigator.serviceWorker.controller)){
            console.error('serviceWorker currently disabled!');
            return false;
        }
        return true;
    }

};

module.exports = messageClient;
