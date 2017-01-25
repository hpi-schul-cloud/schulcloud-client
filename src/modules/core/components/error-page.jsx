import LayoutStatic from '../../static/components/layout';

require('../styles/error-page.scss');

class ErrorPage extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutStatic className="error-page">
				<section className="details">
					<div className="error-code">
						{this.props.error.code}
					</div>
					<div className="error-title">
						{this.props.error.title}
					</div>
					<div className="error-description">
						{this.props.error.description}
					</div>
				</section>
				<div className="bg-graphic bg-graphic-right" />
			</LayoutStatic>
		);
	}
}

ErrorPage.defaultProps = {
	error: {}
};

export default ErrorPage;
