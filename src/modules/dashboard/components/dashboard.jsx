

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
			title: 'Artikel',
			content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. ',
			createdAt: 12345678
		},{
			title: 'Artikel',
			content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. ',
			createdAt: 12345679
		},{
			title: 'Artikel',
			content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. ',
			createdAt: 12345680
		},{
			title: 'Artikel',
			content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. ',
			createdAt: 12345681
		}];

		return (
			<LayoutBackend>
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
