import Layout from '../../core/components/layout'
import SetupFormSchool from './setup-form-school';
import SetupFormTeachers from './setup-form-teachers';
import SetupFormClasses from './setup-form-classes';
import SetupFormCourses from './setup-form-courses';

require('../styles/signup.scss');

class Setup extends React.Component {

	constructor(props) {
		super(props);
	}

	getFormStepUI() {
		switch(this.props.step) {
			case 'school': {
				return <SetupFormSchool {...this.props} />
			}
			case 'teachers': {
				return <SetupFormTeachers {...this.props} />
			}
			case 'classes': {
				return <SetupFormClasses {...this.props} />
			}
			case 'courses': {
				return <SetupFormCourses {...this.props} />
			}
			default: {
				// TODO: refactor to redirect to 404
				return <div>Diese Seite existiert nicht.</div>
			}
		}
	}

	render() {
		return (
			<Layout className="route-signup">
				<div className="container">
					<div className="row">
						<div className="col-md-6 offset-md-3">
							{this.getFormStepUI()}
						</div>
					</div>
				</div>
			</Layout>
		);
	}

}

export default Setup;
