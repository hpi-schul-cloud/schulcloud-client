/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import LandingCTA from "../../static/vue-components/templates/LandingCTA";


storiesOf("Onboarding", module).add("Landing CTA", () => ({
  components: { LandingCTA },
  template: "<LandingCTA subtitle='Mit der HPI Schul-Cloud Unterricht digital gestalten' title='Willkommen in der Schul-Cloud, Carl Cactus' ctaText='Erstelle deinen ersten Kurs'/>"
}));


/* eslint-enable react/react-in-jsx-scope */
