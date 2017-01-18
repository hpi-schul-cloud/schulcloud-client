import {render} from 'react-dom';
import {compose} from 'react-komposer';
import {browserHistory} from 'react-router';

import component from '../components/course';
import { Server, Notification } from '../../core/helpers/';
import actions from '../actions/course';

const coursesService = Server.service('/courses');

const containsId = (array, value) => {
	return array.filter(entry => entry._id == value).length > 0;
};

const composer = (props, onData) => {

	let currentUser = Server.get("user");

	coursesService.find({query: {
		_id: props.params.id,
		$populate: ['ltiToolIds', 'userIds', 'teacherIds', 'classId']
	}}).then(res => {

		let course = res.data[0];

		if (!containsId(course.userIds, currentUser._id) && !containsId(course.teacherIds, currentUser._id)) {
			onData(new Error('You don\'t have the permission to see this page.'));
			return;
		}

		let componentData = {
			actions,
			course: course
		};

		onData(null, componentData);
	}).catch(err => {
		Notification.showError("Kurs wurde nicht gefunden");
		browserHistory.push("/courses/");
	});
};

export default compose(composer)(component);
