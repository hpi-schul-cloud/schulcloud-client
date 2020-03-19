import AlertMessageController from './helpers/AlertMessageController';

let initialized = false;
$(document).ready(function() {
    if (initialized) {
		return;
	}
    initialized = true;
    
    const BACKEND_URL = (document.querySelector('script[data-view]').dataset.backendurl).replace(/\/$/, '');
    const view = document.querySelector('script[data-view]').dataset.view === 'loggedin';
    const alertMessageController = new AlertMessageController(view);

  // EBS-System | Alert
    $.ajax({
        url: `${BACKEND_URL}/alert`,
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        timeout: 8000
    })
    .done((result) => {
        alertMessageController.showAlert(result);
    })
    .fail((error) => {
        console.error('Could not update alerts!');
    });
});
