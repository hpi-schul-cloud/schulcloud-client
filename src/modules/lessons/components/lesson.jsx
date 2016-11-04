

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

import SectionHomework from './homework';
import SectionMaterial from './material';

require('../styles/lesson.scss');

class Lesson extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-lesson">
				<SectionTitle title="Mathe, 12. Dezember 2017" />
				<SectionHomework />
				<SectionMaterial />
			</LayoutBackend>
		);
	}

}

export default Lesson;
