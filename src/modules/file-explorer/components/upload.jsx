import { Link } from 'react-router';

require('../styles/upload.scss');

class Memory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	/* Mock data */
	getData() {
		return [{}];
	}

	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<div className="drop-zone">
							<span><i className="fa fa-cloud-upload" /> Dateien zum Hochladen ablegen.</span>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
