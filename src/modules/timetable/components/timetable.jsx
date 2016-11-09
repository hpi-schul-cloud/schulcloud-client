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
				<SectionTitle title="Timetable" />
				<SectionControls />
				<SectionTable weekday="Montag" />
				<SectionTable weekday="Dienstag" />
				<SectionTable weekday="Mittwoch" />
				<SectionTable weekday="Donnerstag" />
				<SectionTable weekday="Freitag" />
			</LayoutBackend>
		);
	}

}

export default Timetable;
