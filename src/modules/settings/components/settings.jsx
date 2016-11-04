

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

require('../styles/settings.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-settings">
				<SectionTitle title="Einstellungen" />
			</LayoutBackend>
		);
	}

}

export default Dashboard;
