import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { Permissions, Server } from '../../core/helpers/';

import { SubsManager } from 'feathers-subscriptions-manager';

const schoolService = Server.service('/schools');
const courseService = Server.service('/course');
const classService = Server.service('/class');

import component from '../components/administration';
import actions from '../actions/administration';

const composer = (props, onData) => {
	const schoolId = "582c58c72038900b2b7010a8";

	const subManager = new SubsManager();

	subManager.addSubscription(schoolService.get(schoolId), 'school');

	subManager.addSubscription(courseService.find({query: {schoolId: schoolId}}), (courses) => {
		return {courses: courses.data};
	});

	subManager.addSubscription(classService.find({query: {schoolId: schoolId}}), (classes) => {
		return {classes: classes.data};
	});

	subManager.ready((data, initial) => {
		const componentData = Object.assign({}, {actions}, data);
		onData(null, componentData);
	});

};

export default compose(composer)(component);
