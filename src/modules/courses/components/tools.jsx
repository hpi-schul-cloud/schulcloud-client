require('../styles/course.scss');
import Tools from '../../tools/containers/tools';


class SectionTools extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="col-sm-6 no-padding course-subsection left">
				<Tools {... this.props} />
			</div>
		);
	}

}

export default SectionTools;
