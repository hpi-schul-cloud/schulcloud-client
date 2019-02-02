/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import LandingCTA from "../../static/vue-components/templates/LandingCTA";
import TemplateCourseWizard from "../../static/vue-components/wizard/TemplateCourseWizard"
import StepProgress from "../../static/vue-components/wizard/StepProgress"


export const steps = [
        { name: 'Kursdaten'},
        { name: 'Kursmitglieder'},
        { name: 'Abschließen'},
      ];

export const moreProgressSteps = [
        { name: 'One'},
        { name: 'Two'},
        { name: 'Three'},
        { name: 'Four'},
        { name: 'Five'},
      ];


storiesOf("Onboarding", module).add("Landing CTA", () => ({
  components: { LandingCTA },
  template: "<LandingCTA subtitle='Mit der HPI Schul-Cloud Unterricht digital gestalten' title='Willkommen in der Schul-Cloud, Carl Cactus' ctaText='Erstelle deinen ersten Kurs'/>"
}));

storiesOf("Wizard", module).add("Wizard Template 1", () => ({
  components: { TemplateCourseWizard },
  template: '<TemplateCourseWizard :steps="progressSteps" :currentStep="0"/>' ,
  data: () => ({
    progressSteps: steps
  })
})).add("Wizard Template 2", () => ({
  components: { TemplateCourseWizard },
  template: '<TemplateCourseWizard :steps="progressSteps" :currentStep="1"/>' ,
  data: () => ({
    progressSteps: steps
  })
})).add("Wizard Template 3", () => ({
  components: { TemplateCourseWizard },
  template: '<TemplateCourseWizard :steps="progressSteps" :currentStep="2"/>' ,
  data: () => ({
    progressSteps: steps
  })
}));

storiesOf("Wizard", module).add("StepProgress Step 1", () => ({
  components: { StepProgress },
  template: '<StepProgress :steps="progressSteps" :currentStep="0"/> ' ,
  data: () => ({
    progressSteps: steps
  })
})).add("StepProgress Step 2", () => ({
  components: { StepProgress },
  template: '<StepProgress :steps="progressSteps" :currentStep="1"/> ' ,
  data: () => ({
    progressSteps: steps
  })
})).add("StepProgress Step 3", () => ({
  components: { StepProgress },
  template: '<StepProgress :steps="progressSteps" :currentStep="2"/> ' ,
  data: () => ({
    progressSteps: steps
  })
}))
.add("StepProgress 5 Steps", () => ({
  components: { StepProgress },
  template: '<StepProgress :steps="progressSteps" :currentStep="2"/> ' ,
  data: () => ({
    progressSteps: moreProgressSteps
  })
}));

/* eslint-enable react/react-in-jsx-scope */
