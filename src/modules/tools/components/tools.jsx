import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */
import ToolCard from './toolCard';

require('../styles/tools.scss');

class Tools extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="tools">
				<SectionTitle title="Tools" />
				{
					this.props.tools.map((tool) => {
						return <ToolCard {...this.props} key={tool._id} tool={tool} />;
					})
				}
			</LayoutBackend>
		);
	}

}

export default Tools;
