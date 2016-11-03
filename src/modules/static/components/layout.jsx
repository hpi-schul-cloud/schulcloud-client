

import Header from './header';
import Footer from './footer';

class LayoutStatic extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<Header />
				<div>
					{this.props.children}
				</div>
				<Footer />
			</div>
		);
	}

}

export default LayoutStatic;
