<template>
  <div class="profile">
    <div class="profile-header">
      <img class="profile-avatar" src="/images/schools/bp/Georg-Christoph-Lichtenberg-Schule Kassel.jpg" alt="">
      <div class="profile-text">
        <div><span>{../currentUser.firstName} {../currentUser.lastName}</span></div>
        <div><span>Level 1</span></div>
        <br>
        <div><span>10</span> Erfahrungspunkte</div>
        <div><span>1</span> Badge</div>
      </div>
      <div class="clear">

      </div>
    </div>

    <div class="badges">
      <h1>Badges</h1>

    </div>
  </div>
</template>

<script>
  export default {
    components: {
    },
    name: 'Profile',
    data() {
      return {
      };
    },
    methods: {
    }
  };
</script>


<style lang="scss">

</style>
