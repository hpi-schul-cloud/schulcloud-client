import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const authService = Server.service('/auth');
const schoolService = Server.service('/schools');
const systemService = Server.service('/systems');

function capitalizeFirstLetter(string) {
	return string.substr(0, 1).toUpperCase() + string.substr(1);
}

function mapFromArray(array, indexedByProperty) {
	let map = {};
	array.forEach(element => {
		const key = element[indexedByProperty];
		map[key] = element;
	});
	return map;
}

export default {
	login: ({email, password, schoolId, systemId}) => {

		// generate JWT
		authService.create({username: email, password: password, schoolId, systemId})
			.then(user => {

				if (user.token) {

					// Login with JWT
					Server.authenticate({
						type: 'token',
						'token': user.token,
						path: '/auth'
					}).then(function(result) {
						console.info('Authenticated!', Server.get('token'));
						browserHistory.push('/dashboard/');
					}).catch(function(error) {
						console.error('Error authenticating!', error);
						Notification.showError('Error authenticating!');
					});
				}
			})
			.catch(error => {
				Notification.showError(error.message);
				return false;
			});
	},

	loadSchools: () => {
		// load schools
		// returns an object that maps from ids to schools
		return schoolService.find()
			.then(result => {
				let schools = result.data || [];
				let schoolsMap = mapFromArray(schools, '_id');
				return Promise.resolve(schoolsMap);
			});
	},

	loadSystems: (school) => {
		return Promise.all(school.systems.map(id => systemService.get(id)))
			.then(systems => {
				systems.forEach(s => {
					s.type = capitalizeFirstLetter(s.type);
				});
				return systems;
			});
	}
};


