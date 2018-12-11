const toast = function (toast) {

    if(!iziToast){
        return console.error('iziToast missing to display toasts!');
    }

    iziToast.settings({
      position: 'topRight',
      theme: 'light'
    });
  
    if (toast === 'notificationsDisabled') {
      iziToast.warning({
        icon: 'fa fa-envelope',
        title: 'Push-Benachrichtigungen wurden deaktiviert',
        message: 'Klicke zum Aktivieren auf das Icon links neben der Adresszeite und erlaube Benachrichtigungen.',
      });
      return;
    }
    if (toast === 'notificationsEnabled') {
      iziToast.info({
        icon: 'fa fa-envelope',
        title: 'Push-Benachrichtigungen wurden erfolgreich aktiviert',
        message: 'Neuigkeiten können jetzt auf deinem Gerät angezeigt werden.',
      });
      return;
    }
    if (toast === 'notificationRegistrationError') {
      iziToast.error({
        icon: 'fa fa-envelope',
        title: 'Push-Benachrichtigungen konnten nicht aktiviert werden',
        message: 'Beim Aktivieren ist ein interner Fehler aufgetreten.',
      });
      return;
    } 
    if(toast === 'pushDisabled'){
      iziToast.show({
        icon: 'fa fa-envelope',
        title: 'Push-Benachrichtigungen wurden deaktiviert.'
      });
      return;
    }
    if(toast === 'successfullySendPushTestMessage'){
      iziToast.show({
        icon: 'fa fa-envelope',
        title: 'Eine Test-Push-Benachrichtigung wurde versendet.'
      });
      return;
    }
  
    // default
    iziToast.show({
      title: toast
    });
  
  };

  module.exports = toast;
