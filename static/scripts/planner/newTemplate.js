import React from "react";
import ReactDOM from "react-dom";
import TopicTemplateView from "planner-core-lib/lib/components/views/topicTemplate";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  /**
   * Render the list items.
   */
  onCreate = formValues => {
    $.ajax({
      type: "POST",
      url: "/planner/topicTemplates",
      data: formValues,
      success: () => {
        // window.location.pathname = "/planner/myClasses";
        console.log("Success");
      }
    });
  };

  render() {
    return (
      <TopicTemplateView
        valueOptions={this.props.valueOptions}
        initialValues={this.props.initialValues}
        mode="NEW"
        onCreate={this.onCreate}
      />
    );
  }
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
setupMaterialComponents();
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View initialValues={data.initialvalues} valueOptions={data.valueoptions} />,
  $reactRoot[0]
);
