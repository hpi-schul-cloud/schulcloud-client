import { Link } from 'react-router';

require('../styles/sidebar.scss');

class Sidebar extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		$('.mobile-nav-toggle').click((e) => {
			$('aside.nav-sidebar nav:first-child').toggleClass('active');
		});
	}

	render() {
		const sidebarLinks = [{
			name: 'Dashboard',
			icon: 'cloud',
			to: '/dashboard/'
		},{
			name: 'Stundenplan',
			icon: 'table',
			to: '/calendar/'
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
			name: 'Kurse',
			icon: 'graduation-cap',
			to: '/courses/'
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
