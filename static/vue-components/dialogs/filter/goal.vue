<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>Unterrichtsziel</md-dialog-title>

    <div id="goal-picker">
      <md-field>
        <label for="selectedGoal">Unterrichtsziel wählen</label>
        <md-select v-model="selectedGoal" id="selectedGoal" md-dense> <!-- multiple> -->
          <md-option value="Einführung">Einführung</md-option>
          <md-option value="Festigung">Festigung</md-option>
          <md-option value="Wissenstransfer">Wissenstransfer</md-option>
          <md-option value="Spaß">Spaß</md-option>
        </md-select>
      </md-field>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">abbrechen</md-button>
      <md-button class="md-primary" @click="onConfirm">hinzufügen</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'GoalDialog',
    props: ['identifier', 'active'],
    data() {
      return {
        isActive: false,
        selectedGoal: '', // []
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetGoals);
    },
    methods: {
      onConfirm() {
        let displayString, shortDisplayString;

        if (this.selectedGoal.length != 0) {
          // this.apiQuery["GoalName[$in]"] = this.selectedGoal; // corret but api seems broken
          this.apiQuery['goalName[$match]'] = this.selectedGoal;
          this.urlQuery = {goal: this.selectedGoal}; // .reduce((prev, curr) => prev +','+ curr )}
          displayString = `Unterrichtsziel: ${this.selectedGoal}`; // .reduce((prev, curr) => prev +', '+ curr );
          shortDisplayString = this.selectedGoal;
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
      resetGoals(key) {
        if (key == this.identifier) {
          this.selectedGoal = '';
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
  #goal-picker {
    padding: 16px;
  }
</style>
