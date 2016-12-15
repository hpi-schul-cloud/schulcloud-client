import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import SectionSchool from './school';
import SectionCourses from './courses';
import SectionClasses from './classes';
import SectionTeachers from './teachers';
import SectionStudents from './students';

require('../styles/administration.scss');

class Administration extends React.Component {

	constructor(props) {
		super(props);
		Tabs.setUseDefaultStyles(false);
	}

	render() {
		return (
			<LayoutBackend className="route-administration">
				<SectionTitle title="Administration" />
				<SectionSchool {...this.props} />
				<Tabs>
					<TabList
						className="nav nav-tabs"
						activeTabClassName="active"
						disabledTabClassName="disabled">
						<Tab className="nav-item"><a className="nav-link">Kurse</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Klassen</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Lehrer</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Schüler</a></Tab>
					</TabList>
					<TabPanel><SectionCourses {...this.props} /></TabPanel>
					<TabPanel><SectionClasses {...this.props} /></TabPanel>
					<TabPanel><SectionTeachers {...this.props} /></TabPanel>
					<TabPanel><SectionStudents {...this.props} /></TabPanel>
				</Tabs>
			</LayoutBackend>

		);
	}

}

export default Administration;
