import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { s3Service } from '../../core/helpers';
import { Permissions, Server, Notification } from '../../core/helpers/';

import component from '../components/file-explorer';
import actions from '../actions/file-explorer';

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	s3Service.getFileList(`users/${currentUser._id}`)
		.then(res => {
			let componentData = {actions, files: []};

			if( Object.prototype.toString.call( res ) === '[object Array]' ) {
				componentData.files = res;
			} else {
				Notification.showError("Deine Schule hat bislang noch keine Dateiverwaltung ausgewählt");
			}
			
			onData(null, componentData);
		}).catch(err => {
			Notification.showError(err);
	});
};

export default compose(composer)(component);
