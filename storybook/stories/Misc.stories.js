/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import { action } from "@storybook/addon-actions";
import { linkTo } from "@storybook/addon-links";

import PulsatingDot from "../../static/vue-components/courses/PulsatingDot";


storiesOf("Misc", module).add("Pulsing Dot", () => ({
  components: { PulsatingDot },
  template: "<PulsatingDot/>"
}));


/* eslint-enable react/react-in-jsx-scope */
