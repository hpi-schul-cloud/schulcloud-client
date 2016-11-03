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
		}, /*{
			name: 'Kalender',
			icon: 'calendar',
			to: '/lessons/'
		},{
			name: 'Gruppen',
			icon: 'group'
		},{
			name: 'Materialien',
			icon: 'pencil'
		},{
			name: 'Aufgaben',
			icon: 'list-ul'
		}*/
			,{
			name: 'Ordner',
			icon: 'folder-open',
			to: '/content/'
		},{
			name: 'Einstellungen',
			icon: 'gears',
			to: '/settings/'
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
										<span className="">{link.name}</span>
									</Link>
								</li>
							);
						})}

					</ul>
				</nav>
			</aside>
		);
	}

}

export default Sidebar;
