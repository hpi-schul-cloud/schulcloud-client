import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/news';
import { Server, Notification } from '../../core/helpers/';
import actions from '../actions/news';

const newsService = Server.service('/news');

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	newsService.find({
		query: {schoolId: currentUser.schoolId}
	}).then(res => {
		let componentData = {
			actions,
			news: res.data
		};
		onData(null, componentData);
	}).catch(err => {
		Notification.showError(err.message);
	});
};

export default compose(composer)(component);