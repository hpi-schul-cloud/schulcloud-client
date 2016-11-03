
import {browserHistory} from 'react-router';


export default {
	login: ({email, password}) => {
		browserHistory.push('/dashboard/');
	}
};
