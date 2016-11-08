

import LayoutStatic from '../../static/components/layout';

require('../styles/home.scss');

class Home extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutStatic>
				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<h1 className="text-hero">Schul-Cloud Home</h1>
							<h2>description</h2>
						</div>
					</div>
				</div>
				<section id="features">
					<div className="container">
						<div className="row">
							<div className="col-sm-8 offset-sm-2">
								<h1 className="text-hero">Schul-Cloud Home</h1>
								<h2>description</h2>
							</div>
						</div>
					</div>
				</section>
			</LayoutStatic>
		);
	}

}

export default Home;
