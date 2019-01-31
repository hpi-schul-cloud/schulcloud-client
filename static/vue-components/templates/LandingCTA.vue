<template>
  <div class="landing">
    <img class="landing-image" src="../../images/onboarding/lehrer_klasse.png"/>
    <h2 class="center medium-emphasis title">{{title}}</h2>
    <h3 class="center medium-emphasis subtitle">{{subtitle}}</h3>
    <div class="center">
      <ScButton class="cta-button btn-primary btn-large">
        {{ctaText}}
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
      title: String,
      ctaText: String
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

  .title{
    margin-bottom: 0;
  }

  .subtitle{
    margin-bottom: 30px;
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
