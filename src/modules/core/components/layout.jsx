import React from 'react';
import { Link } from 'react-router'

require('../styles/base.scss');
require('../styles/layout.scss');

class Layout extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				{this.props.children}
			</div>
		);
	}
}

export default Layout;
