import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const toolService = Server.service('/ltiTools');
const courseService = Server.service('/courses');

export default {
	createNew: (tool) => {
		toolService.create(tool)
			.then(result => {
				if (result._id) {
					courseService.patch(tool.courseId, { $push: {ltiToolIds: result._id}}).then(result => {
						browserHistory.push(`/courses/${result._id}`);
						Notification.showSuccess("Neues Tool wurde erfolgreich angelegt!");
					}).catch(err => {
						Notification.showError(err.message);
						return false;
					});
				}
			})
			.catch(err => {
				Notification.showError(err.message);
				return false;
			});
	}
};


