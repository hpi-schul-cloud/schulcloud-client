import React from 'react';

import Sidebar from './sidebar.jsx';

require('../styles/layout.scss');

class LayoutBackend extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<Sidebar {...this.props} />
				<div className="content-wrapper">
					<div className="container-fluid">
						<div className="row">
							<div className="col-sm-12">
								{this.props.children}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

}

export default LayoutBackend;
