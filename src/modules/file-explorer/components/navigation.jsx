require('../styles/navigation.scss');

class Navigation extends React.Component {

	constructor(props) {
		super(props);

		this.state = { };
	}

	isActive(scope) {
		return this.props.storageContext.startsWith(scope.storageContext);
	}

	handleOnScopeClick(scope) {
		this.props.onReload(scope.storageContext, this.props.scopes);
	}

	getScopeTitle(scope) {
		switch(scope.type) {
			case 'user': return "Meine Dateien";
			case 'scope': return scope.attributes.name;
			default: return scope.id;
		}
	}

	getScopeUI(scope) {
		return (
			<li key={scope.id} className={this.isActive(scope) ? 'active' : 'non-active'} onClick={this.handleOnScopeClick.bind(this, scope)}>
				<i className={`fa ${this.isActive(scope) ? 'fa-folder-open' : 'fa-folder'}`} aria-hidden="true"></i>
				<span className="link-name">{this.getScopeTitle(scope)}</span>
			</li>
		)
	}

	render() {
		// todo: group by courses and classes
		return (
			<section className="navigation">
				<div className="container-fluid">
					<ul>
						{this.props.scopes.map(scope => this.getScopeUI(scope))}
					</ul>
				</div>
			</section>
		);
	}

}

export default Navigation;
