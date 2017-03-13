import {
	Input,
	Textarea
} from '../../core/helpers/form';
import Table from './table';
import Pagination from 'rc-pagination';
import AdminSection from './admin-section';
import ModalForm from './modal-form';
import Select from 'rc-select';

class SectionNews extends AdminSection {

	constructor(props) {
		super(props);
		const options = {
			title: 'Neuigkeiten',
			addLabel: 'News hinzufügen',
			editLabel: 'News bearbeiten'
		};
		Object.assign(this.options, options);

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			},
			{
				action: this.removeRecord,
				icon: 'trash-o'
			}
		];

		Object.assign(this.state, {title: '', content: '', url: '', updatedAt: ''});
		this.loadContentFromServer = this.props.actions.loadContent.bind(this, '/news');
		this.serviceName = '/news';
	}

	componentDidMount() {
		super.componentDidMount();
	}

	contentQuery() {
		const schoolId = this.props.schoolId;
		return {
			schoolId
		};
	}

	customizeRecordBeforeInserting(data) {
		return this.props.actions.populateFields('/news', data._id);
	}

	getTableHead() {
		return [
			'Titel',
			'Inhalt',
			'URL',
			'last updated',
			''
		];
	}

	getTableBody() {
		return Object.keys(this.state.records).map((id) => {
			const c = this.state.records[id];

			var date = new Date(c.updatedAt);
			return [
				c.title,
				c.content,
				c.url,
				date.getDate().toString()+'.'+date.getMonth().toString()+'.'+date.getFullYear().toString()+' '+date.getHours().toString()+':'+date.getMinutes().toString()+' Uhr',
				this.getTableActions(this.actions, c)
			];
		});
	}

	modalFormUI(newsId) {
		const record = this.state.record;
		return (
		<div>
			<Input
				name="_id"
				type="hidden"
				layout="elementOnly"
				value={this.state.record._id}
			/>

			<Input
				name="schoolId"
				type="hidden"
				layout="elementOnly"
				value={this.props.schoolId}
			/>

			<Input
				name="updatedAt"
				type="hidden"
				layout="elementOnly"
				value={Date.now}
			/>

			<Input
				label="Titel der Neuigkeit"
				name="title"
				type="text"
				placeholder="News"
				layout="vertical"
				value={record.title || ''}
				required
			/>
                        
            <Textarea
                label="Inhalt der Neuigkeit"
				name="content"
				type="text"
				placeholder="Text"
				value={record.content || ''}
				required
			/>

			<Input
				label="URL"
				name="url"
				type="text"
				placeholder="URL"
				layout="vertical"
				value={record.url || ''}
				required
			/>

		</div>
		);
	}

	getPaginationControl() {
		//if (this.state.numberOfPages < 2) return null;
		return (<Pagination
			selectComponentClass={Select}
			locale={require('rc-pagination/lib/locale/en_US')}
			showSizeChanger
			defaultPageSize={this.state.itemsPerPage}
			defaultCurrent={1}
			pageSizeOptions={['10', '25', '50', '100']}
			onShowSizeChange={this.onPageSizeChange.bind(this)}
			onChange={this.onPageChange.bind(this)}
			total={this.state.numberOfPages}
		/>);
	}

	render() {
		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>{this.options.title}</h5>
							<Table head={this.getTableHead()} body={this.getTableBody()} />
							{this.getPaginationControl()}
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

export default SectionNews;