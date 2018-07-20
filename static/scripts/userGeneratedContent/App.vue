<template lang="html">
  <div class="">
    <h1>Lehrer-generierte Inhalte</h1>
    <Search/>
    <GenerateContent/>
  </div>
</template>

<script>
  import Search from './Search.vue';
  import GenerateContent from './GenerateContent.vue';

  export default {
    components: {
      Search,
      GenerateContent
    }
  }
</script>

<style lang="css">
  /* @import './../../../node_modules/vue-material/dist/theme/default.css'  */
  .md-primary {
    color: white;
    background-color: #448aff;
  }

  .md-chip {
    background-color: #b2b2b2;
  }

  .md-chip:hover {
    background-color: #757575;
  }
</style>
