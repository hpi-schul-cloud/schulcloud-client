import React from 'react';

import LayoutBackend from './layout';

require('../styles/dashboard.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const sidebarLinks = [{
			name: 'Dashboard',
			icon: 'user'
		},{
			name: 'Kalender',
			icon: 'calendar'
		},{
			name: 'Gruppen',
			icon: 'group'
		},{
			name: 'Materialien',
			icon: 'pencil'
		},{
			name: 'Aufgaben',
			icon: 'list-ul'
		},{
			name: 'Ordner',
			icon: 'folder-open'
		},{
			name: 'Einstellungen',
			icon: 'gears'
		}];

		return (
			<LayoutBackend sidebarLinks={sidebarLinks}>
				<h1>Dashboard</h1>
			</LayoutBackend>
		);
	}

}

export default Dashboard;
