import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import List from './list';

require('../styles/active-students.scss');

class ActiveStudents extends React.Component {

	constructor(props) {
		super(props);
	}

	getSubtitle() {
		return (
			<div>
				<i className="user-o" aria-hidden="true"></i> <b>24</b> von <b>25</b> Schülern anwesend
			</div>
		);
	}

	render() {
		return (
			<LayoutBase className="route-active-students">
				<SectionTitle title="Schüler" subtitle={this.getSubtitle.bind(this)()} />
				<List />
			</LayoutBase>
		);
	}

}

export default ActiveStudents;
