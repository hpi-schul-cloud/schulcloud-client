
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/content';
import actions from '../actions/content';

const composer = (props, onData) => {
	const query = (props.location.query || {}).q || '';

	actions.findContent(query)
		.then((searchResults, error) => {
			let componentData = {
				actions,
				searchResults,
				query
			};
			if (error) console.error(error);

			onData(error, componentData);
		});
};

export default compose(composer)(component);
