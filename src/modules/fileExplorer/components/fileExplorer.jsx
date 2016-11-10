import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

import Directories from './directories';
import Memory from './memory';
import Files from './files';

require('../styles/fileExplorer.scss');

class FileExplorer extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBackend className="route-fileExplorer">
				<SectionTitle title="Dateien" />
				<Memory />
				<Directories />
				<Files />
			</LayoutBackend>
		);
	}

}

export default FileExplorer;
