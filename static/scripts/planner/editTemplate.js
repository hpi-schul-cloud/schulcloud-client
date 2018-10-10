import React from "react";
import ReactDOM from "react-dom";
import { TopicTemplateView } from "../../vendor/rucola-core-lib";

class View extends React.Component {
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicTemplateView
        id={this.props.id}
        initialValues={this.props.initialValues}
        mode="EDIT"
        onSave={() => {}}
        onDelete={() => {}}
        onCreate={() => {}}
      />
    );
  }
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View initialValues={data.initialvalues} id={data.id} />,
  $reactRoot[0]
);
