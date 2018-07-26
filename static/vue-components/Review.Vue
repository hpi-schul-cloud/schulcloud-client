<template>
  <div class="">
    <md-switch v-model="propose">
      Vorgeschlagene Materialien anzeigen oder selber suchen?
    </md-switch>
    <div v-if="propose" class="">
      Hier kommen demnächst vorgeschlagene Inhalte hin.
    </div>
    <search v-else inReview="true" />
  </div>
</template>

<script>
  import search from  './ContentSearch.vue';

  export default {
    components: {
        'search': search
    },
    name: 'review',
    data() {
      return {
        propose: false
      };
    },
    methods: {
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  @import "./default";


  .md-switch-container {
    background-color: rgba(255,82,82,.38);
  }

  .md-switch-thumb {
    background-color: #ff5252;
  }
</style>
