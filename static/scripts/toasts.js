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
        title: 'Push-Notifications wurden deaktiviert',
        message: 'Klicke zum Aktivieren auf das Icon links neben der Adresszeite und erlaube Benachrichtigungen.',
      });
      return;
    }
    if (toast === 'notificationsEnabled') {
      iziToast.info({
        icon: 'fa fa-envelope',
        title: 'Push-Notifications wurden erfolgreich aktiviert',
        message: 'Neuigkeiten können jetzt auf deinem Gerät angezeigt werden.',
      });
      return;
    }
    if (toast === 'notificationRegistrationError') {
      iziToast.error({
        icon: 'fa fa-envelope',
        title: 'Push-Notifications konnten nicht aktiviert werden',
        message: 'Beim Aktivieren ist ein interner Fehler aufgetreten.',
      });
      return;
    }
  
    // default
    iziToast.show({
      title: toast
    });
  
  };

  module.exports = toast;
