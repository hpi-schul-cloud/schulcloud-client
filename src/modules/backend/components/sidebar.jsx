import React from 'react';
import { Link } from 'react-router';

require('../styles/sidebar.scss');

class Sidebar extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<aside className="nav-sidebar">
				<nav>
					<ul>
						{(this.props.sidebarLinks || []).map((link) => {
							return (
								<li key={link.name}>
									<Link className={link.class} to={link.to}>
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
