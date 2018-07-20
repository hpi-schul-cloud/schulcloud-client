<template>
  <article>
    <h2 class="md-title">Kategorien</h2>
    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Fach:
        </div>
        <div class="md-layout-item">
            <md-chip v-for="(chip, index) in data.subjects" v-model="data.subjects" :key="chip" v-on:click="visibleDialog = 'subject'"
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
            Niveaustufe:
        </div>
        <div class="md-layout-item">
            <md-chip v-for="(chip, index) in data.difficulty" v-model="data.difficulty" :key="chip" v-on:click="visibleDialog = 'difficulty'"
                @md-delete.stop="removeFilter('difficulty', index)" md-clickable md-deletable>{{ chip }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'difficulty'" class="addButton">
                <md-icon><i class="material-icons">add</i></md-icon>
                Niveaustufe hinzufügen
            </md-button>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Unterrichtsziel:
        </div>
        <div class="md-layout-item">
            <md-chip v-for="(chip, index) in data.goal" v-model="data.goal" :key="chip" v-on:click="visibleDialog = 'goal'"
                @md-delete.stop="removeFilter('goal', index)" md-clickable md-deletable>{{ chip }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'goal'" class="addButton">
                <md-icon><i class="material-icons">add</i></md-icon>
                Unterrichtsziel hinzufügen
            </md-button>
        </div>
    </div>

    <div class="md-layout md-alignment-top-center line">
        <div class="md-layout-item md-size-15">
            Alter:
        </div>
        <div class="md-layout-item">
            <md-chip v-model="data.age" key="chip" v-on:click="visibleDialog = 'age'"
                @md-delete.stop="removeFilter('age')" md-clickable md-deletable>{{ data.age }}
            </md-chip>
            <md-button md-menu-trigger v-on:click="visibleDialog = 'age'" class="addButton">
                <md-icon><i class="material-icons">edit</i></md-icon>
                Alter ändern
            </md-button>
        </div>
    </div>
  <!-- <subject-filter-dialog @set="pushFilter" @cancle="cancle" identifier="subjects"
                          v-bind:active="visibleDialog == 'subjects'"/>
  <goal-filter-dialog @set="pushFilter" @cancle="cancle" identifier="goal"
                          v-bind:active="visibleDialog == 'goal'"/>
  <difficulty-filter-dialog @set="pushFilter" @cancle="cancle" identifier="difficulty"
                          v-bind:active="visibleDialog == 'difficulty'"/>
  <age-filter-dialog @set="setFilter" @cancle="cancle" identifier="age"
                          v-bind:active="visibleDialog == 'age'"/> -->

  </article>
</template>

<script>
  // const subjectFilterDialog = () => import(/* webpackChunkName: "subjectFilterDialog" */ '@/components/dialogs/filter/subject.vue');
  // const goalFilterDialog = () => import(/* webpackChunkName: "goalFilterDialog" */ '@/components/dialogs/filter/goal.vue');
  // const difficultyFilterDialog = () => import(/* webpackChunkName: "difficultyFilterDialog" */ '@/components/dialogs/filter/difficulty.vue');
  // const ageFilterDialog = () => import(/* webpackChunkName: "ageFilterDialog" */ '@/components/dialogs/filter/age.vue');

  export default {
    // components: {
    //     'subject-filter-dialog': subjectFilterDialog,
    //     'goal-filter-dialog': goalFilterDialog,
    //     'difficulty-filter-dialog': difficultyFilterDialog,
    //     'age-filter-dialog': ageFilterDialog,
    // },
    props: ['data', 'review'],
    name: 'categories',
    data() {
      return {
        visibleDialog: '',
      };
    },
    methods: {
        pushFilter(identifier, filterData) {
          this.visibleDialog = '';
          this.data[identifier].push(filterData.selection);
        },
        setFilter(identifier, filterData) {
          this.visibleDialog = '';
          this.data[identifier] = filterData.displayString;
        },
        removeFilter(type, index) {
            if (index !== undefined) {
                this.data[type].splice(index, 1);
            } else {
                this.data[type] = undefined;
            }
        },
      cancle() {
        this.visibleDialog = '';
      },
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="css" scoped>
    .line {
        min-height: 50px;
        line-height: 50px;
    }

    .md-size-15 {
        min-width: 15em;
    }
</style>
