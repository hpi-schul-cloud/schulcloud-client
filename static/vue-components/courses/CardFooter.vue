<template>
  <div class="card-footer">
    <font-awesome-icon :icon="['far', 'clock']"/>
    Heute 10:15 I R-1.21
  </div>
</template>

<script>
export default {
  name: 'CardFooter',
  props: {
    course: {
      type: Object
    }
  },
  components: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card-footer {
  
  position: absolute;
  text-align: left;
  background: green;
  
}
</style>
