/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from "@storybook/vue";
import { linkTo } from "@storybook/addon-links";

export const defaultCourse = {
  _id: "0000dcfbfb5c7a3f00bf21abc",
  name: "Biologie",
  abbreviation: "BIO",
  description:
    "Dieser Kurs wurde als Beispiel für den Demo-Zugang erstellt und enthält verschiedene Themen und Inhalte aus dem Fach Biologie! Wir wollen Ihnen dadurch die Breite der Einsatzmöglichkeit der Schul-Cloud im Unterricht aufzeigen! Schauen Sie doch selbst!",
  gradeSystem: false,
  startDate: "2017-10-26T22:00:00.000+0000",
  untilDate: "2018-04-29T22:00:00.000+0000",
  times: [
    {
      _id: "5a0ea5c88620d77b4c87e77f",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 2,
      eventId: "0fc1c965-bcc8-4263-a294-6de20b31968f"
    },
    {
      _id: "5a0ea5c88620d77b4c87e77e",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 1,
      eventId: "fb241b3a-c8ae-4166-90f1-6f3e1d61c85d"
    }
  ],
  color: "#03B2D6",
  schoolId: "0000d186816abba584714c5f",
  teacherIds: ["599ec1688e4e364ec18ff46e", "59ad4c412b442b7f81810285"],
  userIds: ["0000d213816abba584714c0a", "0000d224816abba584714c9c"],
  updatedAt: "2017-01-01T00:06:37.148+0000",
  createdAt: "2017-01-01T00:06:37.148+0000",
  classIds: ["59a3c81ca2049554a93fec58"],
  newAssignments: 0,
  nextCourseTime: "Heute 10:30 | R-1.6",
  courseAlert: "",
  teacherName: "Mustermensch"
};
export const courseWithAssignment = {
  _id: "0000dcfbfb5c7a3f00bf21abc",
  name: "Englisch",
  abbreviation: "ENG",
  description:
    "Dieser Kurs wurde als Beispiel für den Demo-Zugang erstellt und enthält verschiedene Themen und Inhalte aus dem Fach Biologie! Wir wollen Ihnen dadurch die Breite der Einsatzmöglichkeit der Schul-Cloud im Unterricht aufzeigen! Schauen Sie doch selbst!",
  gradeSystem: false,
  startDate: "2017-10-26T22:00:00.000+0000",
  untilDate: "2018-04-29T22:00:00.000+0000",
  times: [
    {
      _id: "5a0ea5c88620d77b4c87e77f",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 2,
      eventId: "0fc1c965-bcc8-4263-a294-6de20b31968f"
    },
    {
      _id: "5a0ea5c88620d77b4c87e77e",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 1,
      eventId: "fb241b3a-c8ae-4166-90f1-6f3e1d61c85d"
    }
  ],
  color: "#FFC400",
  schoolId: "0000d186816abba584714c5f",
  teacherIds: ["599ec1688e4e364ec18ff46e", "59ad4c412b442b7f81810285"],
  userIds: ["0000d213816abba584714c0a", "0000d224816abba584714c9c"],
  updatedAt: "2017-01-01T00:06:37.148+0000",
  createdAt: "2017-01-01T00:06:37.148+0000",
  classIds: ["59a3c81ca2049554a93fec58"],
  newAssignments: 3,
  nextCourseTime: "Heute 10:30 | R-1.6",
  courseAlert: "",
  teacherName: "Mustermensch"
};

export const courseWithAlert = {
  _id: "0000dcfbfb5c7a3f00bf21abc",
  name: "Englisch",
  abbreviation: "ENG",
  description:
    "Dieser Kurs wurde als Beispiel für den Demo-Zugang erstellt und enthält verschiedene Themen und Inhalte aus dem Fach Biologie! Wir wollen Ihnen dadurch die Breite der Einsatzmöglichkeit der Schul-Cloud im Unterricht aufzeigen! Schauen Sie doch selbst!",
  gradeSystem: false,
  startDate: "2017-10-26T22:00:00.000+0000",
  untilDate: "2018-04-29T22:00:00.000+0000",
  times: [
    {
      _id: "5a0ea5c88620d77b4c87e77f",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 2,
      eventId: "0fc1c965-bcc8-4263-a294-6de20b31968f"
    },
    {
      _id: "5a0ea5c88620d77b4c87e77e",
      room: "1.6",
      duration: 5400000,
      startTime: 36000000,
      weekday: 1,
      eventId: "fb241b3a-c8ae-4166-90f1-6f3e1d61c85d"
    }
  ],
  color: "#FFC400",
  schoolId: "0000d186816abba584714c5f",
  teacherIds: ["599ec1688e4e364ec18ff46e", "59ad4c412b442b7f81810285"],
  userIds: ["0000d213816abba584714c0a", "0000d224816abba584714c9c"],
  updatedAt: "2017-01-01T00:06:37.148+0000",
  createdAt: "2017-01-01T00:06:37.148+0000",
  classIds: ["59a3c81ca2049554a93fec58"],
  newAssignments: 3,
  nextCourseTime: "Heute 10:30 | R-1.6",
  courseAlert: "Kurs fällt heute aus!",
  teacherName: "Mustermensch"
};
import CourseCard from "../../static/vue-components/courses/CourseCard";
import Welcome from "./Welcome";

storiesOf("Welcome", module).add("to Storybook", () => ({
  components: { Welcome },
  template: '<welcome :showApp="action" />',
  methods: { action: linkTo("Button") }
}));

storiesOf("CourseCard", module).add("CourseCard mit Content", () => ({
  components: { CourseCard },
  template: '<CourseCard :course="course"/>',
  data: () => ({
    course: defaultCourse
  })
}));

storiesOf("CourseCard", module).add("CourseCard mit Aufgabe", () => ({
  components: { CourseCard },
  template: '<CourseCard :course="course"/>',
  data: () => ({
    course: courseWithAssignment
  })
}));

storiesOf("CourseCard", module).add("CourseCard mit Alert", () => ({
  components: { CourseCard },
  template: '<CourseCard :course="course"/>',
  data: () => ({
    course: courseWithAlert
  })
}));

storiesOf("CourseCard", module).add("CourseCard Empty", () => ({
  components: { CourseCard },
  template: "<CourseCard/>"
}));

/* eslint-enable react/react-in-jsx-scope */
