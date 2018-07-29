<template>
  <div class="">
    <h2>Inhalt bewerten</h2>
    <span>Insgesamt: </span><star-rating v-model="overall" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <span>Inhalt: </span><star-rating v-model="text" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <span>Layout: </span><star-rating v-model="layout" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <md-field>
      <label>Begründung</label>
      <md-textarea v-model="reviewText"></md-textarea>
    </md-field>
    <md-button class="md-primary" @click="accept()">{{ contentChanged ? 'Akzeptieren mit Änderungen' : 'Akzeptieren' }}</md-button>
    <md-button @click="">Ablehnen</md-button>
  </div>
</template>

<script>
  export default {
    components: {
    },
    name: 'RateContent',
    data() {
      return {
        overall: undefined,
        layout: undefined,
        text: undefined,
        reviewText: "",
      };
    },
    props: ['contentId', 'contentChanged'],
    methods: {
      accept() {
        console.log(`Accept content ${this.contentId} with text ${this.reviewText} and overall rating of ${this.overall}, layout rating of ${this.layout} and text rating of ${this.text}`);
        alert("Accept", this.contentId, );
      }
    },
    watch: {
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

</style>
