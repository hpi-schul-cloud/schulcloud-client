import React from "react";
import ReactDOM from "react-dom";
import TopicTemplateView from "planner-core-lib/lib/components/views/topicTemplate";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  onSave = formValues => {
    console.log(formValues);
  };
  onDelete = () => {};
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicTemplateView
        valueOptions={this.props.valueOptions}
        initialValues={this.props.initialValues}
        mode="EDIT"
        onSave={this.onSave}
        onDelete={this.onDelete}
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
  <View
    initialValues={data.initialvalues}
    valueOptions={data.valueoptions}
    id={data.id}
  />,
  $reactRoot[0]
);
