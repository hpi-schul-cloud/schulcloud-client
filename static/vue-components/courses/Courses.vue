<template>
<div id="app">
  <CourseCard v-for="course in courses_obj" :course="course" :key="course._id" />
</div>
</template>

<script>
import CourseCard from './CourseCard.vue'

export default {
  components: {
    CourseCard
  },
  props: {
    courses: String
  },
  computed: {
    courses_obj() {
      return JSON.parse(this.courses);
    }
  }
}
</script>

<style>

#app{
  display: flex;
  flex-wrap: wrap;
}
</style>
