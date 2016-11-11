import LayoutBackend from '../../backend/components/layout';
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
				<SectionTable weekday="Montag" dashboard="false" />
				<SectionTable weekday="Dienstag" dashboard="false" />
				<SectionTable weekday="Mittwoch" dashboard="false" />
				<SectionTable weekday="Donnerstag" dashboard="false" timeline="true" />
				<SectionTable weekday="Freitag" dashboard="false" />
			</LayoutBackend>
		);
	}

}

export default Timetable;
