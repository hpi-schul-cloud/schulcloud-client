import Sidebar from './sidebar';
import Topbar from './topbar';

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
					<Topbar />

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
