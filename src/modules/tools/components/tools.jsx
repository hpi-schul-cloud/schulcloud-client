import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */
import ToolCard from './toolCard';
import {browserHistory} from 'react-router';
import NewToolForm from './newToolForm';

require('../styles/tools.scss');

class Tools extends React.Component {

	constructor(props) {
		super(props);
	}

	handleCreateNew(e) {
		browserHistory.push("/tools/new/");
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
				<button type="button" data-toggle="modal" data-target="#newToolModal" className="btn btn-primary">Neues Tool erstellen</button>

				<div className="modal fade" id="newToolModal" role="dialog" aria-labelledby="myModalLabel">
					<div className="modal-dialog" role="document">
						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
								<h4 className="modal-title" id="myModalLabel">Neues LTI-Tool erstellen</h4>
							</div>
							<div className="modal-body">
								<NewToolForm modal="#"{...this.props} />
							</div>
						</div>
					</div>
				</div>
			</LayoutBackend>
		);
	}

}

export default Tools;
