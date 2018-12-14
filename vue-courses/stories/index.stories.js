/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

export const defaultCourse = {
    "_id": "0000dcfbfb5c7a3f00bf21abc",
    "name": "Mathe",
    "color": "lightgrey",
    "schoolId": "0000d186816abba584714c5f",
    "teacherIds": [
      "0000d231816abba584714c9e"
    ],
    "userIds": [
      "0000d213816abba584714c0a",
      "0000d224816abba584714c9c"
    ],
    "updatedAt": "2017-01-01T00:06:37.148+0000",
    "createdAt": "2017-01-01T00:06:37.148+0000",
    "classIds": []
  };


import MyButton from './MyButton';
import Welcome from './Welcome';
import CourseCard from '../src/components/CourseCard'

storiesOf('Welcome', module).add('to Storybook', () => ({
  components: { Welcome },
  template: '<welcome :showApp="action" />',
  methods: { action: linkTo('Button') },
}));

storiesOf('CourseCard', module).add('populated', () => ({
  components: { CourseCard },
  template: '<CourseCard :course="course"/>',
  data: () => ({
    course: defaultCourse
  }),
}));

storiesOf('CourseCard', module).add('empty', () => ({
  components: { CourseCard },
  template: '<CourseCard/>',
}));

storiesOf('Button', module)
  .add('with text', () => ({
    components: { MyButton },
    template: '<my-button @click="action">Hello Button</my-button>',
    methods: { action: action('clicked') },
  }))
  .add('with JSX', () => ({
    components: { MyButton },
    // eslint-disable-next-line no-unused-vars
    render(h) {
      return <my-button onClick={this.action}>With JSX</my-button>;
    },
    methods: { action: linkTo('clicked') },
  }))
  .add('with some emoji', () => ({
    components: { MyButton },
    template: '<my-button @click="action">😀 😎 👍 💯</my-button>',
    methods: { action: action('clicked') },
  }));

/* eslint-enable react/react-in-jsx-scope */
