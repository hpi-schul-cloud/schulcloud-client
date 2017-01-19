import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import CourseCard from './courseCard';

require('../styles/courses.scss');

class Courses extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBase className="route-courses">
				<SectionTitle title="Kurse" />
				<div className="course-section">
					{
						this.props.courses.map((course) => {
							return <CourseCard {...this.props} key={course._id} course={course} />;
						})
					}
				</div>
			</LayoutBase>
		);
	}

}

export default Courses;
