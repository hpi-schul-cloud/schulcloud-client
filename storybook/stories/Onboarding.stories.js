/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import LandingCTA from "../../static/vue-components/templates/LandingCTA";


storiesOf("Onboarding", module).add("Landing CTA", () => ({
  components: { LandingCTA },
  template: "<LandingCTA/>"
}));


/* eslint-enable react/react-in-jsx-scope */
