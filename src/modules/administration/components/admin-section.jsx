import ReactDOM from 'react-dom';
import Pagination from 'rc-pagination';
import Select from 'rc-select';
import '../styles/rc-pagination.scss';
import '../styles/rc-select.scss';

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

	modalFormUI(record) {
		throw new Error("modalFormUI() has to be implemented by AdminSection.");
	}

	modalUI() {
		const title = this.state.record.name != '' ? this.options.editLabel : this.options.addLabel;
		return (
			<ModalForm
				ref="edit-modal"
				title={title}
				content={this.modalFormUI.bind(this)()}
				submitCallback={this.options.submitCallback.bind(this)}
				{...this.options}
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
			<div className="table-actions">
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

	onPageSizeChange(currentPage, pageSize) {
		console.log(current);
		console.log(pageSize);
	}

	onPageChange(page) {
		console.log(page);
	}

	render() {
		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>{this.options.title}</h5>

							<Table head={this.getTableHead()} body={this.getTableBody()} />
							<Pagination
								selectComponentClass={Select}
								locale={require('rc-pagination/lib/locale/en_US')}
								showSizeChanger
								defaultPageSize={20}
								defaultCurrent={1}
								onShowSizeChange={this.onPageSizeChange.bind(this)}
								onPageChange={this.onPageChange.bind(this)}
								total={450}
							/>
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
