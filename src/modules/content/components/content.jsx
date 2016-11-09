import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

import SectionSearch from '../components/search';

require('../styles/content.scss');

class Content extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend>
				<SectionTitle title="Materialiensuche" />
				<SectionSearch {...this.props} />
			</LayoutBackend>
		);
	}

}

export default Content;
