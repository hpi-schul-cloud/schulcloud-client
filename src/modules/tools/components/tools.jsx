import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */
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
			<LayoutBackend className="tools">
				<SectionTitle title="Tools"/>
				<div className="tools-section">
					{
						this.props.tools.map((tool) => {
							return <ToolCard {...this.props} key={tool._id} tool={tool} />;
						})
					}
				</div>
				<button type="button" style={{visibility: this.handleHasPermission() ? 'visible' : 'hidden'}} onClick={this.handleCreateNew.bind(this)} className="btn btn-primary btn-tools">Neues Tool erstellen</button>
			</LayoutBackend>
		);
	}

}

export default Tools;
