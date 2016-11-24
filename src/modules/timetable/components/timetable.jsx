import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

import SectionTable from './table';
import SectionControls from './controls';

require('../styles/timetable.scss');

class Timetable extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend>
				<SectionTitle title="Stundenplan" />
				<SectionControls />
				<SectionTable weekday="Montag" date="14.11.2016" dashboard="false" />
				<SectionTable weekday="Dienstag" date="15.11.2016" dashboard="false" />
				<SectionTable weekday="Mittwoch" date="16.11.2016" dashboard="false" />
				<SectionTable weekday="Donnerstag" date="17.11.2016" dashboard="false" timeline="true" />
				<SectionTable weekday="Freitag" date="18.11.2016" dashboard="false" />
			</LayoutBackend>
		);
	}

}

export default Timetable;
