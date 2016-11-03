import React from 'react';

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';

import SectionSearch from '../components/search';

require('../styles/content.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend>
				<SectionTitle title="Inhalte" />
				<SectionSearch />
			</LayoutBackend>
		);
	}

}

export default Dashboard;
