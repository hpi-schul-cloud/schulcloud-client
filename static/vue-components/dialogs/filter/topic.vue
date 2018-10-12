<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>Thema</md-dialog-title>

    <div id="topic-picker">
        <md-autocomplete v-model="selectedTopics" :md-options="topics">
              <label>Thema</label>

              <template slot="md-autocomplete-item" slot-scope="{ item, term }">
                <md-highlight-text :md-term="term">{{ item }}</md-highlight-text>
              </template>

              <template slot="md-autocomplete-empty" slot-scope="{ term }">
                Zu diesem Thema gibt es keine Treffer.
              </template>
        </md-autocomplete>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">abbrechen</md-button>
      <md-button class="md-primary" @click="onConfirm">hinzufügen</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'TopicDialog',
    props: ['identifier', 'active'],
    data() {
      return {
        isActive: false,
        apiQuery: {},
        urlQuery: {},
        selectedTopics: null,
        topics: ["Thema1", "Thema2", "Thema3"], // TODO: get selection from topic table
      };
    },
    created() {
      this.$parent.$on('reset', this.resetSubjects);
    },
    methods: {
      onConfirm() {
        let displayString;

        if (this.selectedTopics.length != 0) {
          // this.apiQuery["topicName[$in]"] = this.selectedTopics; // corret but api seems broken
          this.apiQuery['topicName[$match]'] = this.selectedTopics;
          this.urlQuery = {topic: this.selectedTopics}; // .reduce((prev, curr) => prev +','+ curr )}
          displayString = `Thema: ${this.selectedTopics}`; // .reduce((prev, curr) => prev +', '+ curr );
        } else {
          this.apiQuery = {};
          this.urlQuery = {};
          displayString = null;
        }
        this.$emit('set', this.identifier, {
          apiQuery: this.apiQuery,
          urlQuery: this.urlQuery,
          displayString,
          selection: this.selectedTopics,
        });
      },
      onCancle() {
        this.$emit('cancle');
      },
      addNewTopic(term) {
        this.topics.push(term)
      },
      resetSubjects(key) {
        if (key == this.identifier) {
          this.selectedTopics = [];
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
  #topic-picker {
    padding: 16px;
  }
  .md-autocomplete + strong {
    margin-top: 36px;
    display: block;
  }
  .md-menu-content {
    z-index: 110;
  }
</style>
