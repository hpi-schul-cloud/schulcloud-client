/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import BtnPrimary from "../../static/vue-components/buttons/BtnPrimary";


storiesOf("Buttons", module).add("Button Primary", () => ({
  components: { BtnPrimary },
  template: "<BtnPrimary>Standard Button</BtnPrimary>"
}));


/* eslint-enable react/react-in-jsx-scope */
