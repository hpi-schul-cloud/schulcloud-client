import React from 'react';
import ReactDOM from 'react-dom';
import { SchicView as RucolaSchicView } from '../../vendor/rucola-core-lib';
import { styles as schulCloudStyles} from './schulCloudStyles';

class SchicView extends React.Component {
  /**
   * Render the list items.
   */
  render() {
    return <RucolaSchicView 
      styles={schulCloudStyles} 
      onSave={values => console.log(values)}
    />;
  }
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
const reactRoot = document.getElementById("react-root");

ReactDOM.render(<SchicView />, reactRoot);
