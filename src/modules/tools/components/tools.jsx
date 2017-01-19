import LayoutBase from '../../base/containers/layout';
import ToolCard from './toolCard';
import {browserHistory} from 'react-router';
import { Permissions, Server } from '../../core/helpers/';
import permissions from '../permissions';
require('../styles/tools.scss');

class Tools extends React.Component {

	constructor(props) {
		super(props);
	}

	handleCreateNew(e) {
		browserHistory.push("/tools/new/");
	}

	handleHasPermission(e) {
		const currentUser = Server.get('user');
		return Permissions.userHasPermission(currentUser, permissions.NEW_VIEW);
	}

	render() {
		return (
			<div className="tools-section">
				<h5>Tools</h5>
				<div className="row">
					{
						this.props.tools.map((tool) => {
							return <ToolCard {...this.props} key={tool._id} tool={tool} />;
						})
					}
				</div>
				<button type="button" style={{visibility: this.handleHasPermission() ? 'visible' : 'hidden'}} onClick={this.handleCreateNew.bind(this)} className="btn btn-primary btn-tools">Neues Tool erstellen</button>
			</div>
		);
	}

}

export default Tools;
