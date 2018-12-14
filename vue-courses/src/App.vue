<template>
<div id="app">
  <img alt="Vue logo" src="./assets/logo.png">
  {{fullName}}
  <input id="input0" v-model="firstName"/>
  <CourseCard v-for="course in courses" :course="course" :key="course._id" />
</div>
</template>

<script>
import CourseCard from './components/CourseCard.vue'

export default {
  name: 'app',
  components: {
    CourseCard
  },
  computed: {
    fullName () {
      return this.firstName + ' ' + this.lastName
    }
  },
  data: function() {
    return {
      firstName: 'axel',
      lastName: 'schweiz',
      courses: [{
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
          "classIds": [

          ]
        },
        {
          "_id": "0000dcfbfb5c7a3f00bf21ab",
          "name": "Deutsch",
          "color": "lightblue",
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
          "classIds": [

          ]
        }
      ]
    }
  },
  watch: {
    //firstName(alt,neu) {
      //console.log('obacht');
      //console.log(alt);
      //console.log(neu);
    //}
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
