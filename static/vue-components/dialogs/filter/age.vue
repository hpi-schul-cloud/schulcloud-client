<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>Alter</md-dialog-title>

    <div id="age-picker">
      <md-field>
        <label for="selectedAge">Alter wählen</label>
        <md-input v-model="selectedAge" id="selectedAge" type="number" min="3" max="80"></md-input>
      </md-field>
      <md-field>
        <label for="selectedAgeRange">+/- Jahre</label>
        <md-input v-model="range" id="selectedAgeRange" type="number" min="0" max="20"></md-input>
      </md-field>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">Abbrechen</md-button>
      <md-button class="md-primary" @click="onConfirm">Hinzufügen</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'AgeDialog',
    props: ['identifier', 'active'],
    data() {
      return {
        isActive: false,
        selectedAge: 10, // []
        range: 1,
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetAge);
    },
    methods: {
      onConfirm() {
        let displayString, shortDisplayString;

        if (this.selectedAge) {
          // this.apiQuery["GoalName[$in]"] = this.selectedDifficulty; // corret but api seems broken
          this.apiQuery['ageName[$match]'] = this.selectedAge; //TODO: Range
          this.urlQuery = {age: this.selectedAge, ageRange: this.range}; // .reduce((prev, curr) => prev +','+ curr )} // TODO: Range
          displayString = "Alter: " + this.selectedAge + "Jahre +- " + this.range + " Jahre"; // .reduce((prev, curr) => prev +', '+ curr );
          shortDisplayString = this.selectedAge + "Jahre +- " + this.range + " Jahre";
        } else {
          this.apiQuery = {};
          this.urlQuery = {};
          displayString = null;
          shortDisplayString = null;
        }
        this.$emit('set', this.identifier, {
          apiQuery: this.apiQuery,
          urlQuery: this.urlQuery,
          displayString,
          shortDisplayString
        });
      },
      onCancle() {
        this.$emit('cancle');
      },
      resetDifficulty(key) {
        if (key == this.identifier) {
          this.selectedDifficulty = '';
        }
      },
    },
    watch: {
      active(to, from) {
        this.isActive = to;
      },
      isActive(to) {
        if (to == false) {
          this.onCancle();
        }
      },
    },
  };
</script>

<style lang="scss">
  #age-picker {
    padding: 16px;
  }
</style>
