

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

require('../styles/settings.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const sidebarLinks = [{
			name: 'Dashboard',
			icon: 'user',
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
			class: 'active',
			to: '/settings/'
		}];

		return (
			<LayoutBackend sidebarLinks={sidebarLinks}>
				<SectionTitle title="Einstellungen" />
			</LayoutBackend>
		);
	}

}

export default Dashboard;
