import Layout from '../../core/components/layout';
import SignupFormAdmin from './signup_form_admin';
import SignupFormSchool from './signup_form_school';
import SignupFormTeachers from './signup_form_teachers';
import SignupFormClasses from './signup_form_classes';
import SignupFormCourses from './signup_form_courses';

import {
	Checkbox,
	CheckboxGroup,
	Icon,
	Input,
	RadioGroup,
	Row,
	Select,
	File,
	Textarea,
	ReactSelect,
	Form
} from '../../core/helpers/form';

require('../styles/signup.scss');

class Signup extends React.Component {

	constructor(props) {
		super(props);
	}

	getFormStepUI() {
		switch(this.props.step) {
			case 'admin': {
				return <SignupFormAdmin />
			}
			case 'school': {
				return <SignupFormSchool />
			}
			case 'teachers': {
				return <SignupFormTeachers />
			}
			case 'classes': {
				return <SignupFormClasses />
			}
			case 'courses': {
				return <SignupFormCourses />
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

export default Signup;
