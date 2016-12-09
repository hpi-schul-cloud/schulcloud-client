import { Link } from 'react-router';
require('../styles/toolCard.scss');
require('../../../static/images/cloud.png');

class ToolCard extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	handleConnect(e) {
		this.props.actions.connect(this.props.tool);
	}


	render() {
		var tool = this.props.tool;
		return (
			<Link className="col-sm-4 tool-card" onClick={this.handleConnect.bind(this)}>
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
		);
	}
}

export default ToolCard;
