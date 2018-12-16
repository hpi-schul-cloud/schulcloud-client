import React from "react";
import ReactDOM from "react-dom";
import { CalendarView } from "planner-core-lib/lib/components/views/calendar";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  redirectToEditInstance = instanceId => {
    window.location = `/planner/topicInstances/${instanceId}`;
  };

  render() {
    return (
      <CalendarView
        schoolYear={this.props.schoolYear}
        utcToday={this.props.utcToday}
        classTopicsData={this.props.classTopicsData}
        holidaysData={this.props.holidaysData}
        otherEventsData={this.props.otherEventsData}
        onTopicInstanceClick={this.redirectToEditInstance}
      />
    );
  }
}

/**
 * Render the React root into a <div> of the current page.
 */
setupMaterialComponents();
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View
    schoolYear={data.schoolyear}
    utcToday={data.utctoday}
    classTopicsData={data.classtopicsdata}
    holidaysData={data.holidaysdata}
    otherEventsData={data.othereventsdata}
  />,
  $reactRoot[0]
);
