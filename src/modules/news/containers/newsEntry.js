import {render} from 'react-dom';
import {compose} from 'react-komposer';
import {browserHistory} from 'react-router';

import component from '../components/newsEntry';
import { Server, Notification } from '../../core/helpers/';
import actions from '../actions/newsEntry';

const newsService = Server.service('/news');

const composer = (props, onData) => {
	let currentUser = Server.get("user");

	newsService.find({query: {
		createdAt: props.params.createdAt
	}}).then(res => {
		let newsEntry = res.data[0];

		if (newsEntry.schoolId != currentUser.schoolId) {
			onData(new Error('You don\'t have the permission to see this page.'));
			return;
		}

		let componentData = {
			actions,
			news: newsEntry
		};

		onData(null, componentData);
	}).catch(err => {
		Notification.showError("News-Eintrag wurde nicht gefunden");
		browserHistory.push("/news/");
	});
};

export default compose(composer)(component);
