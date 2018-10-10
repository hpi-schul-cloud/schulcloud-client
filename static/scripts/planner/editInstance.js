import React from "react";
import ReactDOM from "react-dom";
import { TopicInstanceView } from "../../vendor/rucola-core-lib";

class View extends React.Component {
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicInstanceView
        id={this.props.id}
        initialValues={this.props.initialValues}
        onSave={() => {}}
        onDelete={() => {}}
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
