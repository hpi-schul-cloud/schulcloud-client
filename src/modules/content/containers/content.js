
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/content';
import actions from '../actions/content';

const composer = (props, onData) => {
	const searchString = (props.location.query || {}).q || '';

	actions.findContent({searchString})
		.then((searchResults, error) => {
			let componentData = {
				actions,
				searchResults,
				searchString
			};
			if (error) console.error(error);

			onData(error, componentData);
		});
};

export default compose(composer)(component);
