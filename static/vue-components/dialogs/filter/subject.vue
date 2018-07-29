<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>Unterrichtsfach</md-dialog-title>

    <div id="subject-picker">
      <md-field>
        <label for="selectedSubjects">Unterrichtsfach wählen</label>
        <md-select v-model="selectedSubjects" id="selectedSubjects" md-dense> <!-- multiple> -->
          <md-option value="Biologie">Biologie</md-option>
          <md-option value="Chemie">Chemie</md-option>
          <md-option value="Deutsch">Deutsch</md-option>
          <md-option value="Englisch">Englisch</md-option>
          <md-option value="Erdkunde/Geographie">Erdkunde/Geographie</md-option>
          <md-option value="Ethik/Lebenskunde">Ethik/Lebenskunde</md-option>
          <md-option value="Französisch">Französisch</md-option>
          <md-option value="Ethik">Ethik</md-option>
          <md-option value="Informatik">Informatik</md-option>
          <md-option value="Kunst">Kunst</md-option>
          <md-option value="Latein">Latein</md-option>
          <md-option value="Mathematik">Mathematik</md-option>
          <md-option value="Musik">Musik</md-option>
          <md-option value="Pädagogik">Pädagogik</md-option>
          <md-option value="Philosophie">Philosophie</md-option>
          <md-option value="Physik">Physik</md-option>
          <md-option value="Politik und Wirtschaft">Politik und Wirtschaft</md-option>
          <md-option value="Psychologie">Psychologie</md-option>
          <md-option value="Religion">Religion</md-option>
          <md-option value="Sport">Sport</md-option>
          <md-option value="Weiteres">Weiteres</md-option>
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
    name: 'SujectDialogb',
    props: ['identifier', 'active'],
    data() {
      return {
        isActive: false,
        selectedSubjects: [],
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetSubjects);
    },
    methods: {
      onConfirm() {
        let displayString;

        if (this.selectedSubjects.length != 0) {
          // this.apiQuery["subjectName[$in]"] = this.selectedSubjects; // corret but api seems broken
          this.apiQuery['subjectName[$match]'] = this.selectedSubjects;
          this.urlQuery = {subjects: this.selectedSubjects}; // .reduce((prev, curr) => prev +','+ curr )}
          displayString = `Fach: ${this.selectedSubjects}`; // .reduce((prev, curr) => prev +', '+ curr );
        } else {
          this.apiQuery = {};
          this.urlQuery = {};
          displayString = null;
        }
        this.$emit('set', this.identifier, {
          apiQuery: this.apiQuery,
          urlQuery: this.urlQuery,
          displayString,
          selection: this.selectedSubjects,
        });
      },
      onCancle() {
        this.$emit('cancle');
      },
      resetSubjects(key) {
        if (key == this.identifier) {
          this.selectedSubjects = [];
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
  #subject-picker {
    padding: 16px;
  }
</style>
