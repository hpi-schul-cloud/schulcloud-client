import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';

import SectionSearch from '../components/search';

require('../styles/content.scss');

class Content extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBase>
				<SectionTitle title="Materialiensuche" />
				<SectionSearch {...this.props} />
			</LayoutBase>
		);
	}

}

export default Content;
