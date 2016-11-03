import {Link} from 'react-router'

require('../styles/header.scss');

class Header extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<header>
				<div className="container-fluid">
					<nav className="navbar navbar-light">
						<Link className="navbar-brand" to="/">Schul-Cloud</Link>
						<ul className="nav navbar-nav">
							<li className="nav-item">
								<Link className="nav-link" to="/">Home</Link>
							</li>
							<li className="nav-item">
								<Link className="nav-link" to="/login/">Login</Link>
							</li>
						</ul>
					</nav>
				</div>
			</header>
		);
	}
}

export default Header;
