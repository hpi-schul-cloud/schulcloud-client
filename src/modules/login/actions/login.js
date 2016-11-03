import React from 'react';
import {browserHistory} from 'react-router';


export default {
	login: ({email, password}) => {
		console.log(email, password);
		browserHistory.push('/dashboard/');
		//userService.create({firstName: 'Bla'});
	}
};
