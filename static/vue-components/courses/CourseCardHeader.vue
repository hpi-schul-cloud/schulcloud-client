<template>
  <div class="card-main-content" v-bind:style="background_style">
    {{course.name}}
    <br>
  </div>
</template>

<script>
export default {
  props: {
    course: {
      type: Object
    }
  },
  computed: {
    }
  }
};
</script>


<style scoped>
.card-main-content {
  font-family: "Asul", sans-serif;
  color: aliceblue;

}
</style>