<template>
  <div class="root">
      <h2>Wizard Titel</h2>
      <StepProgress :steps="steps" :currentStep="currentStep"/>

      <div v-show="currentStep == 0">
        <h3>Step 1</h3>
        <div class="form-group">
            <label for="email">Email address</label>
            <input type="email" name="email" class="form-control" aria-describedby="emailHelp" placeholder="Enter email">
            <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" name="password" class="form-control" placeholder="Password">
        </div>
    </div>

    <div v-show="currentStep == 1">
        <h3>Step 2</h3>
        <div class="form-group">
            <label for="select">Example select</label>
            <select class="form-control" name="select">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
            </select>
        </div>
    </div>

    <div v-show="currentStep == 2">
        <h3>Step 3</h3>
        <div class="form-group">
            <label for="textarea">Example textarea</label>
            <textarea class="form-control" name="textarea" rows="4"></textarea>
        </div>
        <div class="form-group">
            <label for="file">File input</label>
            <input type="file" class="form-control-file" name="file" aria-describedby="fileHelp">
            <small id="fileHelp" class="form-text text-muted">This is some placeholder block-level help text for the above input. It's a bit lighter and easily wraps to a new line.</small>
        </div>
    </div>

  </div>
</template>

<script>
import '../styles/base.css';
import StepProgress from "./StepProgress.vue";
export default {
  name: 'TemplateCourseWizard',
  props: {
    currentStep: Number,
    steps: Array
  },
  components: {StepProgress},
  data() {
    return {
      stepList: [
        { name: 'eins'},
        { name: 'zwei'},
        { name: 'drei'}
      ]
    }
  },
  computed: {
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
