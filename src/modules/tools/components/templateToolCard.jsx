import {Link} from 'react-router';
import NewToolForm from './newToolForm';
require('../styles/toolCard.scss');
require('../../../static/images/cloud.png');

class ToolCard extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		var tool = this.props.tool;
		return (
			<div>
				<Link className="col-sm-4 tool-card" data-toggle="modal" data-target={"#newToolModal" + tool.name}>
					<div className="card">
						{ tool.logo_url
							? <img className="card-img-top" src={tool.logo_url} alt="Card image cap"/>
							: <img className="card-img-top" src="/images/cloud.png" alt="Card image cap"/>
						}
						<div className="card-block">
							<h4 className="card-title">{tool.name}</h4>
						</div>
					</div>
				</Link>

				<div className="modal fade" id={"newToolModal" + tool.name} role="dialog" aria-labelledby="myModalLabel">
					<div className="modal-dialog" role="document">
						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
									aria-hidden="true">&times;</span></button>
								<h4 className="modal-title" id="myModalLabel">Neues LTI-Tool erstellen</h4>
							</div>
							<div className="modal-body">
								<NewToolForm toolTemplate={tool} modal="#"{...this.props} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ToolCard;
