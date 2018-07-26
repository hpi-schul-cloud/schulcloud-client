<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>Unterrichtsziel</md-dialog-title>

    <div id="goal-picker">
      <md-field>
        <label for="selectedGoals">Unterrichtsziel wählen</label>
        <md-select v-model="selectedGoals" id="selectedGoals" md-dense> <!-- multiple> -->
          <md-option value="Einführung">Einführung</md-option>
          <md-option value="Festigung">Festigung</md-option>
          <md-option value="Wissenstransfer">Wissenstransfer</md-option>
          <md-option value="Spaßstunde">Spaßstunde</md-option>
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
        selectedGoals: '', // []
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetGoals);
    },
    methods: {
      onConfirm() {
        let displayString;

        if (this.selectedGoals.length != 0) {
          // this.apiQuery["GoalName[$in]"] = this.selectedGoals; // corret but api seems broken
          this.apiQuery['goalName[$match]'] = this.selectedGoals;
          this.urlQuery = {goal: this.selectedGoals}; // .reduce((prev, curr) => prev +','+ curr )}
          displayString = `Unterrichtsziel: ${this.selectedGoals}`; // .reduce((prev, curr) => prev +', '+ curr );
        } else {
          this.apiQuery = {};
          this.urlQuery = {};
          displayString = null;
        }
        this.$emit('set', this.identifier, {
          apiQuery: this.apiQuery,
          urlQuery: this.urlQuery,
          displayString,
        });
      },
      onCancle() {
        this.$emit('cancle');
      },
      resetGoals(key) {
        if (key == this.identifier) {
          this.selectedGoals = '';
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

<style lang="scss" scoped>
  #goal-picker {
    padding: 16px;
  }
</style>
