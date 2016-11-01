import React from 'react';

import LoginForm from './login_form.jsx';
import LayoutStatic from '../../static/components/layout';

require('../styles/login.scss');

class Login extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutStatic>
				<h1>Schul-Cloud</h1>
				<LoginForm {...this.props} />
			</LayoutStatic>
		);
	}

}

export default Login;
