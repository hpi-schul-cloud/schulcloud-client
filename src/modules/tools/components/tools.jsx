import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

require('../styles/tools.scss');

class FileExplorer extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="tools">
				<SectionTitle title="Tools" />
			</LayoutBackend>
		);
	}

}

export default FileExplorer;
