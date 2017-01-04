import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';

import SectionNotifications from './notifications';
import SectionPrivacy from './privacy';

require('../styles/settings.scss');

class Settings extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBase className="route-settings">
				<SectionTitle title="Mein Profil" />
				<SectionNotifications />
				<SectionPrivacy />
			</LayoutBase>
		);
	}

}

export default Settings;
