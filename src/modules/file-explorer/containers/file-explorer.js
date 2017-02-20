import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { FileService } from '../../core/helpers';
import { Permissions, Server, Notification, RandomIdGenerator } from '../../core/helpers/';

import component from '../components/file-explorer';
import actions from '../actions/file-explorer';

const composer = (props, onData) => {

	const currentUser = Server.get('user');
	const scopeService = Server.service('resolve/scopes');
	const getFiles = (storageContext, scopes) => {
		console.log(storageContext);
		var context = storageContext || `users/${currentUser._id}`;
		FileService.getFileList(context)
			.then(res => {
				console.log(res);
				let componentData = {
					actions,
					files: [],
					directories: [],
					storageContext: context,
					onReload: getFiles,
					scopes: scopes
				};

				if( res.files ) {
					componentData.files = res.files;
					componentData.directories = res.directories;
					componentData.files.forEach(f => f.id = RandomIdGenerator.generateRandomId());
					componentData.directories.forEach(d => d.id = RandomIdGenerator.generateRandomId());
				} else {
					Notification.showError("Deine Schule hat bislang noch keine Dateiverwaltung ausgewählt");
				}

				onData(null, componentData);
			}).catch(err => {
				console.log(err);
				Notification.showError(err);
			});
	};

	scopeService.get(currentUser._id).then(res => {
		// todo: get type of each scope, e.g. course or class
		getFiles(`users/${currentUser._id}`, res.data);
	}).catch(err => {
		console.log(err);
		Notification.showError(err);
	});
};

export default compose(composer)(component);
