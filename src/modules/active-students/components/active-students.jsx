import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

import List from './list';

require('../styles/active-students.scss');

class ActiveStudents extends React.Component {

	constructor(props) {
		super(props);
	}

	getSubtitle() {
		return (
			<div>
			</div>
		);
	}

	render() {
		return (
				<List />
			</LayoutBackend>
		);
	}

}

export default ActiveStudents;
