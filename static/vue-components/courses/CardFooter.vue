<template>
  <div class="footer">
    <div class="footer-next-course" v-if="course.courseAlert == ''">
      <font-awesome-icon :icon="['far', 'clock']" size="lg" /> {{course.nextCourseTime}}
    </div>
    <div class="footer-alert" v-else>
      <div class="ring-container">
        <div class="ringring"></div>
        <div class="circle"></div>
      </div>
      <div class="alert-label"> {{course.courseAlert}}</div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'CardFooter',
    props: {
      course: {
        type: Object,
        default: {}
      }
    },
    components: {},
    computed: {}
  
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .footer {
    height: 24px;
    padding-top: 5px;
    margin-bottom: -5px;
    overflow: hidden;
  }
  
  .footer-next-course {
    text-align: left;
    font-size: 16px;
    font-family: PT Sans Narrow;
    color: #494949;
  }
  
  .footer-alert {
    display: flex;
    align-items: center;
  }
  
  .alert-label {
    flex: 1;
    font-family: "PT Sans Narrow";
    font-weight: bold;
    color: #DD0000;
  }
  
  .ring-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 25px;
    height: 25px;
  }
  
  .circle {
    width: 9px;
    height: 9px;
    background-color: #DD0000;
    border-radius: 50%;
    position: absolute;
  }
  
  .ringring {
    border: 1px solid #DD0000;
    -webkit-border-radius: 30px;
    height: 15px;
    width: 15px;
    align-self: center;
    -webkit-animation: pulsate 2s ease-out;
    -webkit-animation-iteration-count: infinite;
    opacity: 0.0
  }
  
  @-webkit-keyframes pulsate {
    0% {
      -webkit-transform: scale(0.1, 0.1);
      opacity: 0.0;
    }
    50% {
      opacity: 1.0;
    }
    100% {
      -webkit-transform: scale(1.2, 1.2);
      opacity: 0.0;
    }
  }
</style>
