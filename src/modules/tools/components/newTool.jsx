import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */
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
			<LayoutBase className="tools">
				<SectionTitle title="Tool Vorlagen"/>
				<div className="tools-section">
					{
						this.props.tools.map((tool) => {
							idCount++;
							return <TemplateToolCard {...this.props} key={idCount} modalId={idCount} tool={tool} courses={this.props.courses} />;
						})
					}
				</div>
			</LayoutBase>
		);
	}

}

export default NewTool;
