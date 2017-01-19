import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/courses';
import { Server, Notification } from '../../core/helpers/';
import actions from '../actions/courses';

const coursesService = Server.service('/courses');

const composer = (props, onData) => {

	const currentUser = Server.get('user');
	coursesService.find({
		query: {
			$or: [{teacherIds: currentUser._id}, {userIds: currentUser._id}]
		}
	}).then(res => {
		let componentData = {
			actions,
			courses: res.data
		};

		onData(null, componentData);
	}).catch(err => {
		Notification.showError(err.message);
	});
};

export default compose(composer)(component);
