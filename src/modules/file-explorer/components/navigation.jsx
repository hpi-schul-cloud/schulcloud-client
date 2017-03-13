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

	getCourseScopesUI() {
		let courseScopes = this.props.scopes.filter(scope => scope.attributes.scopeType == 'course');
		return (
			<div>
				<div className="title">
					<i className="fa fa-graduation-cap" aria-hidden="true"></i>
					<span>Meine Kurse</span>
				</div>
				<ul className="courses">
					{courseScopes.map(scope => this.getScopeUI(scope))}
				</ul>
			</div>
		)
	}

	getClassesScopesUI() {
		let classScopes = this.props.scopes.filter(scope => scope.attributes.scopeType == 'class');
		return (
			<div>
				<div className="title">
					<i className="fa fa-book" aria-hidden="true"></i>
					<span>Meine Klassen</span>
				</div>
				<ul className="classes">
					{classScopes.map(scope => this.getScopeUI(scope))}
				</ul>
			</div>
		)
	}

	getOtherScopesUI() {
		let otherScopes = this.props.scopes.filter(scope => scope.attributes.scopeType != 'class' && scope.attributes.scopeType != 'course');
		return (
			<ul>
				{otherScopes.map(scope => this.getScopeUI(scope))}
			</ul>
		)
	}

	render() {
		return (
			<section className="navigation">
				<div className="container-fluid">
					{this.getOtherScopesUI()}
					{this.getCourseScopesUI()}
					{this.getClassesScopesUI()}
				</div>
			</section>
		);
	}

}

export default Navigation;
