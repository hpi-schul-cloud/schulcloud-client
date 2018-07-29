<template>
  <div class="">
    <label for="contentTitle">Titel: </label>
    <input type="text" name="contentTitle" v-model="teacherContent.title">
    <br>
    <textarea name="name" rows="8" cols="80" v-model="teacherContent.content"></textarea>
  </div>
</template>

<script>

  export default {
    components: {
    },
    props: ['teacherContent'],
    name: 'TeacherContent',
    data() {
      return {
      };
    },
    methods: {
    },
    watch: {
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

</style>
