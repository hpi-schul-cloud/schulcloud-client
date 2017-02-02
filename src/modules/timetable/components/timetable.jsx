import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import SectionTable from './table';
import SectionControls from './controls';

require('../styles/timetable.scss');

class Timetable extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBase>
				<SectionTitle title="Stundenplan" />
				<SectionControls />
				<SectionTable weekday="Montag" date="14.11.2016" dashboard="false" />
				<SectionTable weekday="Dienstag" date="15.11.2016" dashboard="false" />
				<SectionTable weekday="Mittwoch" date="16.11.2016" dashboard="false" />
				<SectionTable weekday="Donnerstag" date="17.11.2016" dashboard="false" timeline="true" />
				<SectionTable weekday="Freitag" date="18.11.2016" dashboard="false" />
			</LayoutBase>
		);
	}

}

export default Timetable;
