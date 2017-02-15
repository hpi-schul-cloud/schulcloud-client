

import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';

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
			<LayoutBase className="route-lesson">
				<SectionTitle title="Biologie, 23. März 2017" subtitle={this.getSubtitleUI.bind(this)()} />
				<SectionHomework />
				<SectionMaterial />
			</LayoutBase>
		);
	}

}

export default Lesson;
