import ReactDOM from 'react-dom';

class ModalForm extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.$container = $(ReactDOM.findDOMNode(this));
		this.$form = this.$container.find('form');
	}

	arrayToObject(array) {
		let newObject = {};
		array.forEach((el) => {
			newObject[el.name] = el.value;
		});
		return newObject;
	}

	onSubmit() {
		const data = this.arrayToObject(this.$form.serializeArray());
		this.props.submitCallback(data);
	}

	render() {
		let closeIcon = '';
		let closeButton = '';
		if(this.props.closable) {
			closeIcon = (
				<button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={this.props.closeCallback.bind(this)}>
					<span aria-hidden="true">&times;</span>
				</button>
			);

			closeButton = (
				<button type="button" className="btn btn-secondary" data-dismiss="modal">{this.props.closeLabel}</button>
			);
		}

		return (
			<div className="modal fade" tabIndex="-1" role="dialog" aria-hidden="true">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							{closeIcon}
							<h4 className="modal-title">{this.props.title}</h4>
						</div>
						<div className="modal-body">
							<form>
								{this.props.content}
							</form>
						</div>
						<div className="modal-footer">
							{closeButton}&nbsp;
							<button type="button" data-dismiss="modal" className="btn btn-primary" onClick={this.onSubmit.bind(this)}>
								{this.props.submitLabel}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

ModalForm.defaultProps = {
	closable: true,
	closeLabel: 'Close',
	closeCallback: () => {},

	submitLabel: 'Submit',
	submitCallback: (data) => {}
}

export default ModalForm;
