import Layout from '../../core/components/layout';

import Sidebar from './sidebar';
import Topbar from './topbar';
import Footer from '../../static/components/footer'

require('../styles/layout.scss');

class LayoutBackend extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Layout {...this.props}>
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
				<Footer />
			</Layout>
		);
	}

}

export default LayoutBackend;
