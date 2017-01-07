import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/login';
import actions from '../actions/login';

import { Server } from '../../core/helpers';

const schoolService = Server.service('/schools');
const systemService = Server.service('/systems');

function composer(props, onData) {
	if(Server.get('user')) {
		browserHistory.push('/dashboard/');
		console.info('Already loggedin, redirect to dashboard');
	} else {
		// load schools
		schoolService.find()
		.then(result => {
			let schools = result.data || [];

			return Promise.all(schools.map(school => {
				// load systems
				Promise.all(school.systems.map(id => systemService.get(id)))
					.then(systems => {
						school.systems = systems.map(system => {
							system.type = system.type.substr(0, 1).toUpperCase() + system.type.substr(1);	// capitalize
							return system;
						});
						return school.systems;
					})
					.catch(error => {
						onData(error);
					});

				return school;
			}));
		})
		.then(schoolsArray => {
			let schoolsObject = {};
			schoolsArray.forEach((school) => {
				schoolsObject[school._id] = school;
			});

			let componentData = {
				actions,
				reference: props.location.query.ref,
				schools: schoolsObject
			};

			onData(null, componentData);
		})
		.catch(error => {
			onData(error);
		});
	}
}

export default compose(composer)(component);
