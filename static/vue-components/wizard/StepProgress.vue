<template>
  <div class="container">
       <ul class="progressbar">
         <li v-bind:style="{width: stepWidth}" v-for="(s,index) in steps" :class="[ index == currentStep ? 'active' : '', index < currentStep ? 'done' : '' ]">{{ s.name }}</li>
       </ul>
   </div>
</template>

<script>
export default {
  name: 'StepProgress',
  props: {
    steps: Array,
    currentStep: Number
  },
  components: {},
  computed: {
    stepWidth: function () {
        return 100 / this.steps.length + "%";
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container{
  width: 100%;
  position: relative;
  z-index: 1;
}
.progressbar{
  counter-reset: step;
  list-style: none;
}
.progressbar li{
  float: left;
  position: relative;
  text-align: center;
}

.progressbar li.active::after{
  background: #3aac5d;
}
.progressbar li.active::before {
  border-color: #4A4A4A;
  background: #4A4A4A;
  color: white;
}
.progressbar li.done::before {
  border-color: #3aac5d;
  background: #3aac5d;
  color: white;
}
.progressbar li.done::after {
  background: #3aac5d;
  color: white;
}

.progressbar li::before{
  content:counter(step);
  counter-increment: step;
  width: 50px;
  height: 50px;
  border: 2px solid #bebebe;
  display: block;
  margin: 0 auto 10px auto;
  border-radius: 50%;
  line-height: 50px;
  text-align: center;
  font-weight: bold;
  background: white;
  color: white;
  border-color: #4A4A4A;
  background: #4A4A4A;
}

.progressbar li:after{
  content: '';
  position: absolute;
  width:100%;
  height: 3px;
  background: #979797;
  top: 25px;
  left: -50%;
  z-index: -1;
}

.progressbar li:first-child:after{
  content: none;
}
</style>
