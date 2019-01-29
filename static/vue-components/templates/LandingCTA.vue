<template>
  <div class="landing">
    <h3 class="center medium-emphasis">{{subtitle}}</h3>
    <h2 class="center medium-emphasis">{{title}}</h2>
    <img class="landing-image" src="../../images/onboarding/lehrer_klasse.png"/>
    <div class="cta-group center">
      <ScButton class="cta-button btn-secondary">
        Material hochladen
      </ScButton>
      <ScButton class="cta-button btn-primary">
        Erstelle deinen ersten Kurs
      </ScButton>
  </div>
  </div>
</template>

<script>
  import '../styles/base.css';
  import ScButton from '../buttons/ScButton.vue';
  export default {
    name: 'LandingCTA',
    components: {
      ScButton
    },
    props: {
      subtitle: String,
      title: String
    },
    data() {
      return {
      };
    },
    methods: {
      onClick() {
        this.$emit('click');
      },
    },
  };

</script>

<style scoped>
  .center{
    text-align: center;
  }

  .cta-button{
    margin-bottom: 30px;
  }

  .landing-image{
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 30px;
    margin-bottom: 30px;
    width: 35%;
  }

  @media only screen and (max-width: 600px) {
    .cta-button{
      width: 90%;
    }

  }

</style>
