<template>
  <div>
    <h3>{{course.name}}</h3>
    <h3 v-if="course.name === 'Mathe'">Mathe is kacke</h3>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    course: {}
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  color: red;
}
</style>
