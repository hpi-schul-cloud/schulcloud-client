import React from 'react';

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';
import SectionTimetable from './timetable';
import SectionTools from './tools';
import SectionNews from './news';
import SectionMessages from './messages';

require('../styles/dashboard.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const sidebarLinks = [{
			name: 'Dashboard',
			icon: 'user',
			class: 'active',
			to: '/dashboard/'
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
			icon: 'gears',
			to: '/settings/'
		}];


		const tools = [{
			label: 'Dashboard',
			icon: 'user'
		},{
			label: 'Kalender',
			icon: 'calendar'
		},{
			label: 'Gruppen',
			icon: 'group'
		},{
			label: 'Video',
			icon: 'camera'
		}];

		const articles = [{
			label: 'Dashboard',
			icon: 'user'
		},{
			label: 'Kalender',
			icon: 'calendar'
		},{
			label: 'Gruppen',
			icon: 'group'
		},{
			label: 'Video',
			icon: 'camera'
		}];

		return (
			<LayoutBackend sidebarLinks={sidebarLinks}>
				<SectionTitle title="Dashboard" location="school" />
				<SectionTimetable />
				<SectionMessages />
				<SectionTools buttons={tools} />
				<SectionNews articles={articles} />
			</LayoutBackend>
		);
	}

}

export default Dashboard;
