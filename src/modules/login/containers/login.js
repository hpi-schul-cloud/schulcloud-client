
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/login';
import actions from '../actions/login';
import { server } from '../../feathers';

const schoolService = server.service('/schools');

function composer(props, onData) {

	schoolService.find()
		.then(result => {
			const schools = result.data;
			let schoolMap = new Map();
			schools.forEach(s => {
				schoolMap.set(s._id, s);
			});
			let componentData = {
				actions,
				schools,
				schoolMap
			};
			onData(null, componentData);
		})
		.catch(error => {
			onData(error);
		});

}

};

export default compose(composer)(component);
