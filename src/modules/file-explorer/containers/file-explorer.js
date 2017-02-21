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
		// todo: retrieve correct storageContext from scope-type + scope-id
		res.data.forEach(scope => {
			switch(scope.type) {
				case 'user': scope.storageContext = `users/${scope.id}`; break;
				case 'course': scope.storageContext = `courses/${scope.id}`; break;
				case 'class': scope.storageContext = `classes/${scope.id}`; break;
				default: scope.storageContext = `scope/${scope.id}`; break;
			}
		});
		getFiles(`users/${currentUser._id}`, res.data);
	}).catch(err => {
		console.log(err);
		Notification.showError(err);
	});
};

export default compose(composer)(component);
