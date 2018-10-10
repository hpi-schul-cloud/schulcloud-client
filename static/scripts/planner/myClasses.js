import React from "react";
import ReactDOM from "react-dom";
import { ClassConfigurationView } from "../../vendor/rucola-core-lib";

class View extends React.Component {
  redirectToAddTemplate = (subjectId, classLevelId) => {
    window.location.pathname = `/planner/topicTemplates/new?subjectId=${subjectId}&classLevelId=${classLevelId}`;
  };

  render() {
    return (
      <ClassConfigurationView
        schoolYear={this.props.schoolYear}
        eventData={this.props.eventData}
        allClassTopics={this.props.allClassTopics}
        allTopicTemplates={this.props.allTopicTemplates}
        onAddTemplate={this.redirectToAddTemplate}
        onSaveClassInstances={instances => console.log(instances)}
      />
    );
  }
}

/**
 * Render the React root into a <div> of the current page.
 */
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View
    schoolYear={data.schoolyear}
    eventData={data.eventdata}
    allClassTopics={data.allclasstopics}
    allTopicTemplates={data.alltopictemplates}
  />,
  $reactRoot[0]
);
