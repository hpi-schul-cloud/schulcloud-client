import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

import SectionSchool from './school';
import SectionCourses from './courses';
import SectionClasses from './classes';
import SectionTeachers from './teachers';
import SectionStudents from './students';

require('../styles/administration.scss');

class Administration extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-administration">
				<SectionTitle title="Administration" />
				<SectionSchool {...this.props} />

				<SectionCourses {...this.props} />
				<SectionClasses {...this.props} />
				<SectionTeachers {...this.props} />
				<SectionStudents {...this.props} />

			</LayoutBackend>
		);
	}

}

export default Administration;
