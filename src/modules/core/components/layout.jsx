import { Link } from 'react-router'

import Bootstrap from '../scripts/bootstrap/bootstrap.min.js'

require('../styles/base.scss');
require('../styles/layout.scss');

class Layout extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div {...this.props}>
				{this.props.children}
			</div>
		);
	}
}

export default Layout;
