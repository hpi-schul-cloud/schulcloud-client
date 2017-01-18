import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

import signupActions from '../../signup/actions/signup';

const authService = Server.service('/auth');
const schoolService = Server.service('/schools');
const systemService = Server.service('/systems');
const accountService = Server.service('/accounts');

const authenticate = ({username, password}) => {
	return Server.authenticateUser({
		strategy: 'local',
		username,
		password,
		storage: window.localStorage
	});
};

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
	login: ({username, schoolId, systemId, password, email}) => {
		if(!username) username = email;

		// check if account already exists
		return accountService.find({query: {username, systemId}}).then((result) => {
			// account exists => login with _id from account
			if(result.data.length) {
				// we can't just use account to login as it has hashed password
				return authenticate({username, password});
			} else {
				// account exists not => signup Account
				return signupActions.signupAccount({username, schoolId, systemId, password})
					.then((account) => {
						console.log(account);

						return authenticate({username, password});
					}).catch(() => {
						// account credentials not valid
						return new Error('Could not create new account for this credentials.');
					});
			}
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


