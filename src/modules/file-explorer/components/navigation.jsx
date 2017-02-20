require('../styles/navigation.scss');

class Navigation extends React.Component {

	constructor(props) {
		super(props);

		this.state = { };
	}

	handleOnScopeClick(scope) {
		// todo: retrieve correct storageContext from scope-type + scope-id
		this.props.onReload(`courses/${scope.id}`, this.props.scopes);
	}

	getScopeUI(scope) {
		return (
			<li key={scope.id} onClick={this.handleOnScopeClick.bind(this, scope)}>
				<i className='fa fa-folder' aria-hidden="true"></i>
				<span className="link-name">{scope.id}</span>
			</li>
		)
	}

	render() {
		return (
			<section className="navigation">
				<div className="container-fluid">
					{this.props.scopes.map(scope => this.getScopeUI(scope))}
				</div>
			</section>
		);
	}

}

export default Navigation;
