import { configure, addDecorator } from "@storybook/vue";
import Vue from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faClock, faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { withNotes } from '@storybook/addon-notes';
import { withCssResources } from '@storybook/addon-cssresources';library.add(faClock, faCalendarCheck);

addDecorator(withNotes);


Vue.component("font-awesome-icon", FontAwesomeIcon);
// automatically import all files ending in *.stories.js
const req = require.context("../stories", true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
