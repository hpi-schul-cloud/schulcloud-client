import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */
import {browserHistory} from 'react-router';
import TemplateToolCard from './templateToolCard';

require('../styles/tools.scss');

class NewTool extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let idCount = 0;
		return (
			<LayoutBackend className="tools">
				<SectionTitle title="Tool Vorlagen"/>
				<div className="tools-section">
					{
						this.props.tools.map((tool) => {
							idCount++;
							return <TemplateToolCard {...this.props} key={idCount} modalId={idCount} tool={tool} />;
						})
					}
				</div>
			</LayoutBackend>
		);
	}

}

export default NewTool;
