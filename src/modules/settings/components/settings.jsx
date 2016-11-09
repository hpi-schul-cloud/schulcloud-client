import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

require('../styles/settings.scss');

class Settings extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-settings">
				<SectionTitle title="Mein Profil" />
			</LayoutBackend>
		);
	}

}

export default Settings;
