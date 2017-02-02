import {compose} from 'react-komposer';

import component from '../components/error-page';

const composer = (props, onData) => {
	let error;

	switch(props.errorCode) {
		case '403': {
			error = {
				code: 403,
				title: 'Forbidden :(',
				description: `Ups! Da ist etwas schief gelaufen. 
					Du verfügst nicht über die Berechtigungen,
					um auf diese Seite zuzugreifen.`
			};
		}
		break;
		case '404': {
			error = {
				code: 404,
				title: 'Not Found :(',
				description: `Ups! Da ist etwas schief gelaufen. 
					Diese Seite existiert (noch) nicht,
					bitte versuche es nochmal auf einem anderen Weg.`
			};
		}
		break;
		case '500': {
			error = {
				code: 500,
				title: 'Server Error :(',
				description: `Ups! Da ist etwas schief gelaufen.
					Aber unser Team kümmert sich wahrscheinlich gerade schon darum,
					dass die Schul-Cloud gleich wieder funktioniert.`
			};
		}
		break;
		default: {
			error = {
				code: props.errorCode,
				title: 'Unknown Error :(',
				description: `Ups! Da ist etwas schief gelaufen.`
			};
		}
		break;
	}

	onData(null, {error});
};

export default compose(composer)(component);

