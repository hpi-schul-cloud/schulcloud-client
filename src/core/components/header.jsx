import React from 'react';
import {Link} from 'react-router'

require('../styles/header.scss');

class Header extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<header>
				<span>Header</span>
				<ul>
					<li><Link to="/">Home</Link></li>
					<li><Link to="/login/">Login</Link></li>
				</ul>
			</header>
		);
	}
}

export default Header;
