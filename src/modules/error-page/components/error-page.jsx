import LayoutStatic from '../../static/components/layout';
import Forbidden from './forbidden';
import NotFound from './notfound';

require('../styles/error-page.scss');

class ErrorPage extends React.Component {

	constructor(props) {
		super(props);
	}




	render() {
		return (
			<LayoutStatic className="error-page">
				<Forbidden/>
				<div className="bg-graphic bg-graphic-right"></div>

			</LayoutStatic>
		);
	}

}

export default ErrorPage;
