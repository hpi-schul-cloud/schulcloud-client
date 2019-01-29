/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import ScButton from "../../static/vue-components/buttons/ScButton";
import primaryButtonDoc from "../markdown/primaryButton.md";
import { withMarkdownNotes } from "@storybook/addon-notes";

storiesOf("Buttons", module)
.addDecorator(withMarkdownNotes(primaryButtonDoc))
.add("Button Primary", () => ({
  components: { ScButton },
  template: "<ScButton class='btn-primary'>Standard Button</ScButton>",
}))
.add("Button Secondary", () => ({
  components: { ScButton },
  template: "<ScButton class='btn-secondary'>Secondary Button</ScButton>"
}));


/* eslint-enable react/react-in-jsx-scope */
