import { Link } from 'react-router';

require('../styles/topbar.scss');

class Topbar extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<nav className="topbar navbar">


				<ul className="nav navbar-nav float-sm-right">
					<li className="nav-item">
						<a className="nav-link" href="#"><i className="fa fa-envelope" /></a>
					</li>
					<li className="nav-item">
						<div className="btn-group">
							<button type="button" className="btn btn-secondary dropdown-toggle account-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								<img className="avatar" src="https://randomuser.me/api/portraits/men/11.jpg" /><strong>Lukas Müller</strong>
							</button>
							<div className="dropdown-menu dropdown-menu-right">
								<Link className="dropdown-item" to="/login/">Logout</Link>
							</div>
						</div>
					</li>
				</ul>
			</nav>
		);
	}

}

export default Topbar;
