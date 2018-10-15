<template>
  <div>
    <section class="section-title">
      <div class="row" id="titlebar">
        <h1>Kategorien</h1>
      </div>
    </section>
    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Fach:
        </div>
        <div class="md-layout-item">
            <md-chip v-for="(chip, index) in teacherContent.subjects" v-model="teacherContent.subjects" :key="chip" v-on:click="visibleDialog = 'subject'"
                @md-delete.stop="removeFilter('subjects', index)" md-clickable md-deletable>{{ chip }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'subjects'" class="addButton">
                <md-icon><i class="material-icons">add</i></md-icon>
                Fach hinzufügen
            </md-button>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Themen:
        </div>
        <div class="md-layout-item">
            <md-chip v-for="(chip, index) in teacherContent.topics" v-model="teacherContent.topics" :key="chip"
                @md-delete.stop="removeFilter('topics', index)" md-clickable md-deletable>{{ chip }}
            </md-chip>
            <md-autocomplete v-model="topic" :md-options="topics"  @md-selected="topicSelected" @keyup.enter="addNewTopic">
              <template slot="md-autocomplete-item" slot-scope="{ item, term }">
                <md-highlight-text :md-term="term">{{ item }}</md-highlight-text>
              </template>

              <template slot="md-autocomplete-empty" slot-scope="{ term }">
                <span @click="addNewTopic(term)"><a>{{term}}</a> neu anlegen</span>
              </template>
            </md-autocomplete>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Niveaustufe:
        </div>
        <div class="md-layout-item">
            <md-chip v-if="teacherContent.difficulty" v-model="teacherContent.difficulty" :key="teacherContent.difficulty" v-on:click="visibleDialog = 'difficulty'"
                @md-delete.stop="removeFilter('difficulty')" md-clickable md-deletable>{{ teacherContent.difficulty }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'difficulty'" class="addButton">
                <span v-if="teacherContent.difficulty">
                  <md-icon><i class="material-icons">edit</i></md-icon>
                  Niveaustufe ändern
                </span>
                <span v-else>
                  <md-icon><i class="material-icons">add</i></md-icon>
                  Niveaustufe hinzufügen
                </span>
            </md-button>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Unterrichtsziel:
        </div>
        <div class="md-layout-item">
            <md-chip v-if="teacherContent.goal" v-model="teacherContent.goal" :key="teacherContent.goal" v-on:click="visibleDialog = 'goal'"
                @md-delete.stop="removeFilter('goal')" md-clickable md-deletable>{{ teacherContent.goal }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'goal'" class="addButton">
                <span v-if="teacherContent.goal">
                  <md-icon><i class="material-icons">edit</i></md-icon>
                  Unterrichtsziel ändern
                </span>
                <span v-else>
                  <md-icon><i class="material-icons">add</i></md-icon>
                  Unterrichtsziel hinzufügen
                </span>
            </md-button>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Alter:
        </div>
        <div class="md-layout-item">
            <md-chip v-if="teacherContent.age" v-model="teacherContent.age" :key="teacherContent.age" v-on:click="visibleDialog = 'age'"
                @md-delete.stop="removeAge()" md-clickable md-deletable>{{ teacherContent.age + " +- " + teacherContent.ageRange }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'age'" class="addButton">
                <span v-if="teacherContent.age">
                  <md-icon><i class="material-icons">edit</i></md-icon>
                  Alter ändern
                </span>
                <span v-else>
                  <md-icon><i class="material-icons">add</i></md-icon>
                  Alter hinzufügen
                </span>
            </md-button>
        </div>
    </div>
  <subject-filter-dialog @set="setSubjects" @cancle="cancle" identifier="subjects"
                          v-bind:active="visibleDialog == 'subjects'"/>
  <goal-filter-dialog @set="setFilter" @cancle="cancle" identifier="goal"
                          v-bind:active="visibleDialog == 'goal'"/>
  <difficulty-filter-dialog @set="setFilter" @cancle="cancle" identifier="difficulty"
                          v-bind:active="visibleDialog == 'difficulty'"/>
  <age-filter-dialog @set="setAge" @cancle="cancle" identifier="age"
                          v-bind:active="visibleDialog == 'age'"/>

  </div>
</template>

<script>
  import subjectFilterDialog from  './dialogs/filter/subject.vue';
  import goalFilterDialog from  './dialogs/filter/goal.vue';
  import difficultyFilterDialog from  './dialogs/filter/difficulty.vue';
  import ageFilterDialog from  './dialogs/filter/age.vue';

  export default {
    components: {
        'subject-filter-dialog': subjectFilterDialog,
        'goal-filter-dialog': goalFilterDialog,
        'difficulty-filter-dialog': difficultyFilterDialog,
        'age-filter-dialog': ageFilterDialog,
    },
    props: ['teacherContent', 'review'],
    name: 'categories',
    computed: {
      categoriesComplete: function () {
        return this.teacherContent.age && this.teacherContent.subjects && this.teacherContent.difficulty && this.teacherContent.goal;
      }
    },
    watch: {
      categoriesComplete: function(newVal, oldVal) {
        this.$emit('categories-status-changed', newVal)
      }
    },
    data() {
      return {
        visibleDialog: '',
        topics: ["Knochen", "Blutkreislauf", "Auge", "Blut", "Skelett"], // TODO: get selection from topic table
        topic: '',
        newTopics: []
      };
    },
    methods: {
        topicSelected(topic) {
          console.log("topic selected:", topic);
          this.teacherContent.topics.push(topic);
          this.topic = '';
        },
        addNewTopic(topic) {
          console.log("add new topic: ", topic);
          this.teacherContent.topics.push(topic);
          this.topic = '';
          this.newTopics.push(topic)
        },
        pushFilter(identifier, filterData) {
          this.visibleDialog = '';
          this.teacherContent[identifier].push(filterData.selection);
        },
        setFilter(identifier, filterData) {
          this.visibleDialog = '';
          console.log(filterData);
          this.teacherContent[identifier] = filterData.shortDisplayString;
        },
        setSubjects(identifier, filterData) {
          this.visibleDialog = '';
          console.log(filterData);
          this.teacherContent[identifier] = filterData.selection;
        },
        setAge(identifier, data) {
          this.visibleDialog = '';
          this.teacherContent.age = data.urlQuery.age;
          this.teacherContent.ageRange = data.urlQuery.ageRange;
          this.teacherContent.ageDisplayString = data.shortDisplayString;
        },
        removeFilter(type, index) {
            if (index !== undefined) {
                this.teacherContent[type].splice(index, 1);
            } else {
                this.teacherContent[type] = undefined;
            }
        },
        removeAge() {
            teacherContent.age = undefined;
            teacherContent.ageRange = undefined;
        },
      cancle() {
        this.visibleDialog = '';
      },
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
    @import "./default";

    .line {
        min-height: 50px;
        line-height: 50px;
    }

    .md-size-15 {
        min-width: 15em;
    }
</style>
