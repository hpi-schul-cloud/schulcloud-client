import ReactDOM from 'react-dom';

import ModalForm from './modal-form';
import Table from './table';

class AdminSection extends React.Component {

	constructor(props) {
		super(props);

		this.options = {
			title: '',
			addLabel: '',
			editLabel: '',
			submitCallback: () => {}
		}

		this.state = {
			record: {}
		};

		this.defaultRecord = {};
	}

	// TODO: remove while refactoring
	handleRecordChange(e) {
	}


	modalFormUI(record) {
		throw new Error("modalFormUI() has to be implemented by AdminSection.");
	}

	modalUI() {
		const title = this.state.record.name != '' ? this.options.editLabel : this.options.addLabel;
		return (
			<ModalForm
				title={title}
				content={this.modalFormUI.bind(this)()}
				submitCallback={this.options.submitCallback.bind(this)}
			/>
		);
	}

	openModal(record) {
		this.setState({
			record: Object.assign({}, record)
		});
		$(ReactDOM.findDOMNode(this)).find('.modal').modal('show');
	}

	getTableHead() {
		throw new Error("getTableHead() has to be implemented by AdminSection.");
	}

	getTableBody() {
		throw new Error("getTableBody() has to be implemented by AdminSection.");
	}

	getTableActions(actions, record) {
		return (
			<div>
				{actions.map((action, index) => {
					return (
						<a
							key={index}
							className={action.class}
							onClick={action.action.bind(this, record)}>
							<i className={`fa fa-${action.icon}`} />
						</a>
					);
				})}
			</div>
		);
	}

	render() {
		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>{this.options.title}</h5>

							<Table head={this.getTableHead()} body={this.getTableBody()} />
							<button type="submit" className="btn btn-primary" onClick={this.openModal.bind(this, this.defaultRecord)}>
								{this.options.addLabel}
							</button>
						</div>
					</div>
				</div>

				{this.modalUI()}
			</section>
		);
	}

}

export default AdminSection;
