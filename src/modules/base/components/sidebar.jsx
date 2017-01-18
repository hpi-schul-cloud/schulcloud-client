import { Link } from 'react-router';

require('../styles/sidebar.scss');

class Sidebar extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const sidebarLinks = [{
			name: 'Dashboard',
			icon: 'user',
			to: '/dashboard/'
		},{
			name: 'Stundenplan',
			icon: 'table',
			to: '/timetable/'
		},{
			name: 'Materialsuche',
			icon: 'search',
			to: '/content/'
		},{
			name: 'Dateien',
			icon: 'folder-open',
			to: '/files/'
		},{
			name: 'Anwesenheit',
			icon: 'child',
			to: '/active/'
		},{
			name: 'Tools',
			icon: 'cubes',
			to: '/tools/'
		},{
			name: 'Einstellungen',
			icon: 'gears',
			to: '/settings/'
		},{
			name: 'Administration',
			icon: 'wrench',
			to: '/administration/'
		}];

		return (
			<aside className="nav-sidebar">
				<nav>
					<ul>
						<li>
							<a>
								<i className="fa fa-cloud" aria-hidden="true"></i>
								<span className="link-name">Schul-Cloud</span>
							</a>
						</li>
						{sidebarLinks.map((link) => {
							return (
								<li key={link.name}>
									<Link className={link.class} to={link.to} activeClassName="active">
										<i className={'fa ' + 'fa-' + link.icon} aria-hidden="true"></i>
										<span className="link-name">{link.name}</span>
									</Link>
								</li>
							);
						})}

					</ul>
				</nav>
				<a className="mobile-nav-toggle">
					<i className="fa fa-bars" />
				</a>
			</aside>
		);
	}

}

export default Sidebar;
