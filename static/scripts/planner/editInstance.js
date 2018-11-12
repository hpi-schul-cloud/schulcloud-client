import React from "react";
import ReactDOM from "react-dom";
import TopicInstanceView from "planner-core-lib/lib/components/views/topicInstance";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicInstanceView
        initialValues={this.props.initialValues}
        onSave={() => {}}
        onTemplateClick={() => {}}
        onDelete={() => {}}
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
  <View initialValues={data.initialvalues} id={data.id} />,
  $reactRoot[0]
);
