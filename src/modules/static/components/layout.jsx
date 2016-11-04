import Layout from '../../core/components/layout';

import Header from './header';
import Footer from './footer';

class LayoutStatic extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Layout {...this.props}>
				<Header />
				<div>
					{this.props.children}
				</div>
				<Footer />
			</Layout>
		);
	}

}

export default LayoutStatic;
