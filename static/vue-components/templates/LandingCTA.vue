<template>
  <div class="landing">
    <h4 class="center">Willkommen in der HPI Schul-Cloud, Cord Carl</h4>
    <h2 class="center">Mit der Schul-Cloud Unterricht digital gestalten</h2>
    <img class="landing-image" src="../../images/onboarding/lehrer_klasse.png"/>
    <div class="cta-group center">
      <BtnPrimary class="cta-button">
        Material hochladen
      </BtnPrimary>
      <BtnPrimary class="cta-button">
        Erstelle deinen ersten Kurs
      </BtnPrimary>
  </div>
  </div>
</template>

<script>
  import '../styles/base.css';
  import BtnPrimary from '../buttons/BtnPrimary.vue';
  export default {
    name: 'LandingCTA',
    components: {
      BtnPrimary
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
</style>
