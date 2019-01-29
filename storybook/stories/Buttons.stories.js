/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import ScButton from "../../static/vue-components/buttons/ScButton";


storiesOf("Buttons", module).add("Button Primary", () => ({
  components: { ScButton },
  template: "<ScButton class='btn-primary'>Standard Button</ScButton>"
}));

storiesOf("Buttons", module).add("Button Secondary", () => ({
  components: { ScButton },
  template: "<ScButton class='btn-secondary'>Secondary Button</ScButton>"
}));


/* eslint-enable react/react-in-jsx-scope */
