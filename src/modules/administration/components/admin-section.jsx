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


	handleRecordChange(e) {
		let el = e.target;
		let name = el.name;
		let type = el.type;
		let record = this.state.record;

		if (type == 'select-multiple') {
			let selectedOptions = [];
			for (let i = 0, l = el.options.length; i < l; i++) {
				if (el.options[i].selected) {
					selectedOptions.push(el.options[i].value);
				}
			}
			record[name] = selectedOptions;
		} else {
			record[name] = el.value;
		}

		this.setState({record});
	}


	modalFormUI(record) {}

	modalUI() {
		const title = this.state.record.name != '' ? this.options.editLabel : this.options.addLabel;
		return (
			<ModalForm
				title={title}
				content={this.modalFormUI.bind(this)()}
				submitCallback={this.options.submitCallback.bind(this, this.state.record)}
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
		return [];
	}

	getTableBody() {
		return [];
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
