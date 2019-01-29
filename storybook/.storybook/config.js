import { configure, addDecorator } from "@storybook/vue";
import Vue from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faClock, faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueInfoAddon from "storybook-addon-vue-info";
import { checkA11y } from "@storybook/addon-a11y";
// import { withCssResources } from "@storybook/addon-cssresources";
import { withKnobs } from "@storybook/addon-knobs";
import centered from "@storybook/addon-centered";

// addDecorator(withCssResources);
addDecorator(VueInfoAddon);
addDecorator(checkA11y);
addDecorator(withKnobs);
addDecorator(centered);

library.add(faClock, faCalendarCheck);
Vue.component("font-awesome-icon", FontAwesomeIcon);
// automatically import all files ending in *.stories.js
const req = require.context("../stories", true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
