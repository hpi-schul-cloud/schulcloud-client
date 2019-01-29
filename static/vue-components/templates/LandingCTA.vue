<template>
  <div class="landing">
    <h3 class="center medium-emphasis">Willkommen in der HPI Schul-Cloud, Cord Carl</h3>
    <h2 class="center medium-emphasis">Mit der Schul-Cloud Unterricht digital gestalten</h2>
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
