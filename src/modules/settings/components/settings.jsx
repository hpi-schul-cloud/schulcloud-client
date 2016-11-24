import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';

import SectionNotifications from './notifications';
import SectionPrivacy from './privacy';

require('../styles/settings.scss');

class Settings extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-settings">
				<SectionTitle title="Mein Profil" />
				<SectionNotifications />
				<SectionPrivacy />
			</LayoutBackend>
		);
	}

}

export default Settings;
