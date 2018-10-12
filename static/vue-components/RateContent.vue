<template>
  <div class="">
    <h2>Inhalt bewerten</h2>
    <span>Insgesamt: </span><star-rating v-model="overall" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <span>Inhalt: </span><star-rating v-model="text" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <span>Layout: </span><star-rating v-model="layout" :increment="0.5" active-color="#A80731" :star-size="30"></star-rating>
    <md-field class="reviewText">
      <label>Begründung</label>
      <md-textarea v-model="message"></md-textarea>
    </md-field>
    <br>
    <br>
    Denkst du, dass andere Lehrer*Innen diesen Inhalt nützlich finden würden?
    <br>
    <br>
    <md-button class="md-primary" @click="accept()">{{ contentChanged ? 'Ja, mit meinen vorgeschlagenen Änderungen' : 'Ja' }}</md-button>
    <md-button @click="deny()">Nein, bitte überarbeiten</md-button>
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
        message: "",
      };
    },
    props: ['userId', 'contentId', 'contentChanged'],
    methods: {
      accept() {
        console.log(`Accept content ${this.contentId} with text ${this.message} and overall rating of ${this.overall}, layout rating of ${this.layout} and text rating of ${this.text}`);
        this.$emit('step');
        const rating = {
          overall: this.overall,
          layout: this.layout,
          text: this.text,
          message: this.message,
          userId: this.userId
        }
        this.$emit('accepted', rating);
      },
      deny() {
        console.log(`Accept content ${this.contentId} with text ${this.message} and overall rating of ${this.overall}, layout rating of ${this.layout} and text rating of ${this.text}`);
        this.$emit('denied', this.message);
      }
    },
    watch: {
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";
  .vue-star-rating {
    margin-bottom: 5px;
    margin-top: 2px;
  }

  .reviewText {
    width: 50%;
  }

  @media only screen and (max-width: 600px) {
    .reviewText {
        width: 100%;
    }
  }

</style>
