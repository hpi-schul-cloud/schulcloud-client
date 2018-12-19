<template>
  <div class="card-footer-counter">
    <i class="fa fa-user"></i>
    <span>{{(course.userIds||[]).length}}</span>
  </div>
</template>

<script>
export default {
  name: 'CardFooterCounter',
  props: {
    course: {
      type: Object
    }
  },
  computed: {
    background_style () {
      return 'background: ' + this.course.color
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card-footer-counter {
  bottom: 0;
  position: absolute;
  text-align: left;
  padding: 10px;
  left: 20px;
  float: left;
}
</style>
