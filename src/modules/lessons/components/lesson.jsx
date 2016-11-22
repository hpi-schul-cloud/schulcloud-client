

import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';

import SectionHomework from './homework';
import SectionMaterial from './material';

require('../styles/lesson.scss');

class Lesson extends React.Component {

	constructor(props) {
		super(props);
	}

	getSubtitleUI() {
		return (
			<div className="title-tags">
				<span className="tag tag-default">Biologie</span>&ensp;
				<span className="tag tag-default">1. Halbjahr</span>&ensp;
				<span className="tag tag-default">Bienen</span>
			</div>
		);
	}

	render() {
		return (
			<LayoutBackend className="route-lesson">
				<SectionTitle title="Biologie, 17. November 2016" subtitle={this.getSubtitleUI.bind(this)()} />
				<SectionHomework />
				<SectionMaterial />
			</LayoutBackend>
		);
	}

}

export default Lesson;
