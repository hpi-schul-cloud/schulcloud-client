<template>
  <div class="">
    <md-card class="teacherContent-content">
      <md-card-header>
        <div class="md-title">{{teacherContent.title}}</div>
        <div class="md-subhead">{{teacherContent.description}}</div>
      </md-card-header>
      <md-card-content>
        <div v-html="teacherContent.content"></div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>

  export default {
    components: {
    },
    props: ['teacherContent'],
    name: 'TeacherContent',
    data() {
      return {}
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .teacherContent-content {
    min-width: 500px;
    max-width: 800px;
    margin: 0 auto;
  }

  @media only screen and (max-width: 600px) {
    .teacherContent-content {
        width: 100%;
    }
  }

</style>
