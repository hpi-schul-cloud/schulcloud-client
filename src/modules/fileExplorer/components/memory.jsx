require('../styles/memory.scss');

class Memory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	/* Mock data */
	getData() {
		return [{

		}];
	}

	render() {
		return (
			<section>
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding memory">
              <p><i className="fa fa-floppy-o" aria-hidden="true"></i> <b>3.10 MB</b> verwendet von <b>5 GB</b></p>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
