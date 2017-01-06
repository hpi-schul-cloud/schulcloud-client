import {Form} from '../../core/helpers/form';

class ModalForm extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let closeIcon = '';
		let closeButton = '';
		if(this.props.closable) {
			closeIcon = (
				<button
					type="button"
					className="close"
					data-dismiss="modal"
					aria-label="Close"
					onClick={this.props.closeCallback.bind(this)}>
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
						<Form className="edit-form" onValidSubmit={this.props.submitCallback.bind(this)}>
							<div className="modal-header">
								{closeIcon}
								<h4 className="modal-title">{this.props.title}</h4>
							</div>
							<div className="modal-body">
								{this.props.content}
							</div>
							<div className="modal-footer">
								{closeButton}&nbsp;
								<button
									type="submit"
									//data-dismiss="modal"
									className="btn btn-primary">
									{this.props.submitLabel}
								</button>
							</div>
						</Form>
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
