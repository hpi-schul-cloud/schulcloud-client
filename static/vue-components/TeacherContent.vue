<template>
  <div class="">
    <label for="contentTitle">Titel: </label>
    <input type="text" name="contentTitle" v-model="teacherContent.title">
    <br>
    <md-field class="teacherContent-content">
      <label>Inhalt</label>
      <md-textarea v-model="teacherContent.content"></md-textarea>
    </md-field>
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

  .teacherContent-content {
    width: 50%;
  }

  @media only screen and (max-width: 600px) {
    .teacherContent-content {
        width: 100%;
    }
  }

</style>
