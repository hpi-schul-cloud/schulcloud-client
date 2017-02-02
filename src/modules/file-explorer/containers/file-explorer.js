import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { FileService } from '../../core/helpers';
import { Permissions, Server, Notification, RandomIdGenerator } from '../../core/helpers/';

import component from '../components/file-explorer';
import actions from '../actions/file-explorer';

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	FileService.getFileList(`users/${currentUser._id}`)
		.then(res => {
			let componentData = {actions, files: []};

			// if the storage provider does not return any files, there's no empty array but an ugly error message
			if( Object.prototype.toString.call( res ) === '[object Array]' ) {
				componentData.files = res;
				componentData.files.forEach(f => f.id = RandomIdGenerator.generateRandomId());
			} else {
				Notification.showError("Deine Schule hat bislang noch keine Dateiverwaltung ausgewählt");
			}

			onData(null, componentData);
		}).catch(err => {
			Notification.showError(err);
	});
};

export default compose(composer)(component);
