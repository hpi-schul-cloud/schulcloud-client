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
				<div className="container">
					<div className="row">
						<div className="col-md-6 offset-md-3">
							<h3>Schul-Cloud <sup>BETA</sup></h3>
							<LoginForm {...this.props} />
						</div>
					</div>
				</div>

				<div className="bg-graphic bg-graphic-left"></div>
				<div className="bg-graphic bg-graphic-right"></div>
			</LayoutStatic>
		);
	}

}

export default Login;
