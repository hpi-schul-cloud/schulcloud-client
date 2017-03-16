import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';
import SectionTimetable from '../../timetable/components/table';
import SectionControls from '../../timetable/components/controls';
import SectionTools from './tools';
import SectionNews from '../../news/containers/newsSection';
import SectionMessages from './messages';
import SectionTasks from './tasks';
import { Link } from 'react-router';

require('../styles/dashboard.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const tools = [{
			label: 'Office',
			icon: 'pencil'
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
			<LayoutBase className="route-dashboard">
				<SectionTitle title="Dashboard" location={this.props.location.query.l || 'school'} />
				<SectionTasks location={this.props.location.query.l || 'school'} />
				<SectionControls dashboard="true" />
				<SectionTimetable weekday="Donnerstag" timeline="true" />
				<SectionMessages />
				<SectionTools buttons={tools} />
				<SectionNews />
			</LayoutBase>
		);
	}

}

export default Dashboard;
