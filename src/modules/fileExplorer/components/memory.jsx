import { Link } from 'react-router';

require('../styles/memory.scss');

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
			<section className="memory">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-4 no-padding">
							<Link href="#">
								<i className="fa fa-upload" aria-hidden="true"></i>Hochladen
							</Link>
						</div>
						<div className="col-sm-8 no-padding rightSide">
							<p>
								<i className="fa fa-floppy-o" aria-hidden="true"></i>
								<b> 3.10 MB</b> verwendet von <b>5 GB</b>
							</p>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
