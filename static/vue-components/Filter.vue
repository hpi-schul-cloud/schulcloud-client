<template>
  <div class="filter">
    <span class="points-message" v-if="gamification">Sie haben noch genügend Punkte für {{ weeksLeft }} Wochen.</span>

    <md-chip v-for="chip in activeFilter" v-model="activeFilter" :key="chip[0]" v-on:click="visibleProvider = chip[0]"
             @md-delete.stop="removeFilter(chip[0], true)" md-clickable md-deletable>{{ chip[1].displayString }}
    </md-chip>

    <md-menu md-direction="bottom-end">
      <md-button md-menu-trigger>
        <md-icon><i class="material-icons">add</i></md-icon>
        FILTER HINZUFÜGEN
      </md-button>
      <!-- TODO nur bestaetigte inhalte -->
      <!-- <md-button v-show="!inReview" class="md-primary" v-on:click="toggleOnlyApproved">
        {{approvedOnly ? "Alle Inhalte" : "Nur akzeptierte Inhalte" }}
      </md-button> -->
      <md-menu-content>
        <md-menu-item :disabled="!enoughPoints && gamification" v-if="!isApplied('subjects')" v-on:click="visibleProvider = 'subjects'">
            Fach
            <md-tooltip class="tooltip" md-direction="right" v-if="!enoughPoints && gamification" md-delay="1000">Um diese Suchfilter benutzen zu können, benötigen Sie mehr Punkte. Wie Sie diese erhalten, können Sie hier (todo) nachlesen</md-tooltip>
        </md-menu-item>
        <md-menu-item :disabled="!enoughPoints && gamification" v-if="!isApplied('topics')" v-on:click="visibleProvider = 'topics'">
            Thema
            <md-tooltip class="tooltip" md-direction="right" v-if="!enoughPoints && gamification" md-delay="1000">Um diese Suchfilter benutzen zu können, benötigen Sie mehr Punkte. Wie Sie diese erhalten, können Sie hier (todo) nachlesen</md-tooltip>
        </md-menu-item>
        <md-menu-item :disabled="!enoughPoints && gamification" v-if="!isApplied('goal')" v-on:click="visibleProvider = 'goal'">
            Unterrichtsziel
            <md-tooltip class="tooltip" md-direction="right" v-if="!enoughPoints && gamification" md-delay="1000">Um diese Suchfilter benutzen zu können, benötigen Sie mehr Punkte. Wie Sie diese erhalten, können Sie hier (todo) nachlesen</md-tooltip>
        </md-menu-item>
        <md-menu-item :disabled="!enoughPoints && gamification" v-if="!isApplied('difficulty')" v-on:click="visibleProvider = 'difficulty'">
            Niveaustufe
            <md-tooltip class="tooltip" md-direction="right" v-if="!enoughPoints && gamification" md-delay="1000">Um diese Suchfilter benutzen zu können, benötigen Sie mehr Punkte. Wie Sie diese erhalten, können Sie hier (todo) nachlesen</md-tooltip>
        </md-menu-item>
        <md-menu-item :disabled="!enoughPoints && gamification" v-if="!isApplied('age')" v-on:click="visibleProvider = 'age'">
            Alter
            <md-tooltip class="tooltip" md-direction="right" v-if="!enoughPoints && gamification" md-delay="1000">Um diese Suchfilter benutzen zu können, benötigen Sie mehr Punkte. Wie Sie diese erhalten, können Sie hier (todo) nachlesen</md-tooltip>
        </md-menu-item>
        <md-menu-item v-if="!isApplied('provider')" v-on:click="visibleProvider = 'provider'">
            Anbieter
        </md-menu-item>
        <md-menu-item v-if="!isApplied('createdat')" v-on:click="visibleProvider = 'createdat'">
            Erstellt am
        </md-menu-item>
      </md-menu-content>
    </md-menu>

    <provider-filter-dialog @set="setFilter" @cancle="cancle" identifier="provider"
                            v-bind:active="visibleProvider == 'provider'"/>
    <createdat-filter-dialog @set="setFilter" @cancle="cancle" identifier="createdat"
                            v-bind:active="visibleProvider == 'createdat'"/>
    <subject-filter-dialog @set="setFilter" @cancle="cancle" identifier="subjects"
                            v-bind:active="visibleProvider == 'subjects'"/>
    <goal-filter-dialog @set="setFilter" @cancle="cancle" identifier="goal"
                            v-bind:active="visibleProvider == 'goal'"/>
    <difficulty-filter-dialog @set="setFilter" @cancle="cancle" identifier="difficulty"
                            v-bind:active="visibleProvider == 'difficulty'"/>
    <age-filter-dialog @set="setFilter" @cancle="cancle" identifier="age"
                            v-bind:active="visibleProvider == 'age'"/>
  </div>
</template>

<script>
  import providerFilterDialog from  './dialogs/filter/provider.vue';
  import createdAtFilterDialog from  './dialogs/filter/date.vue';
  import subjectFilterDialog from  './dialogs/filter/subject.vue';
  import goalFilterDialog from  './dialogs/filter/goal.vue';
  import difficultyFilterDialog from  './dialogs/filter/difficulty.vue';
  import ageFilterDialog from  './dialogs/filter/age.vue';

  export default {
    components: {
      'provider-filter-dialog': providerFilterDialog,
      'createdat-filter-dialog': createdAtFilterDialog,
      'subject-filter-dialog': subjectFilterDialog,
      'goal-filter-dialog': goalFilterDialog,
      'difficulty-filter-dialog': difficultyFilterDialog,
      'age-filter-dialog': ageFilterDialog
    },
    name: 'SearchFilter',
    data() {
      return {
        enoughPoints: false,
        approvedOnly: false,
        teacherPoints: 0,
        weeksLeft: 0,
        visibleProvider: '',
        activeFilter: [],
      };
    },
    props: ['inReview', 'userId', 'gamification'],
    created() {
      this.getTeacherPoints();
      if (this.inReview) {
        this.setFilter("provider", {
          apiQuery: { 'providerName[$match]': "Schul-Cloud" },
          urlQuery: {provider: 'Schul-Cloud' },
          displayString: "Anbieter: Schul-Cloud",
          shortDisplayString: "Schul-Cloud"
        })
        this.sendNewQuery();
      }
    },
    methods: {
      setFilter(identifier, filterData) {
        this.visibleProvider = '';
        filterData = JSON.parse(JSON.stringify(filterData)); // deep copy
        this.removeFilter(identifier, false);
        this.activeFilter.push([identifier, filterData]);
      },
      removeFilter(key, emit) {
        this.activeFilter = this.activeFilter.filter(item => item[0] != key);
        if (emit) {
          this.$emit('reset', key);
        }
      },
      cancle() {
        this.visibleProvider = '';
      },
      toggleOnlyApproved() {
        this.approvedOnly = !this.approvedOnly;
        if (this.approvedOnly) {
          let approvedFilter = {
            apiQuery: {'approved[$match]': true},
            urlQuery: {approved: true},
            displayString: 'Nur akzeptierte Inhalte',
            shortDisplayString: 'Nur akzeptierte Inhalte'
          };
          this.activeFilter.push(["approvedOnly", approvedFilter]);
        } else {
          this.removeFilter("approvedOnly", false);
        }
        this.sendNewQuery();
      },
      sendNewQuery() {
        const apiQuery = {};
        const urlQuery = {};
        this.activeFilter.forEach((value) => {
          Object.assign(apiQuery, value[1].apiQuery);
          Object.assign(urlQuery, value[1].urlQuery);
        }, {});
        this.$emit('newFilter', apiQuery, urlQuery);
      },
      isApplied(identifier) {
        return this.activeFilter.map(i => i[0]).includes(identifier);
      },
      getTeacherPoints() {
        var that = this;
        this.$http
          // .get(this.$config.API.baseUrl + this.$config.API.gamificationPort + '/user/' + this.userId, {
          .get('http://localhost:3131/user/' + this.userId, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            },
          })
          .then((response) => {
            console.log(response.body);
            that.teacherPoints = response.body.xp[0] ? response.body.xp[0].amount : 10; // TODO: Instead of setting it to 0, emit an event
          })
          .catch((e) => {
            console.error(e);
          });
      },
    },
    watch: {
      activeFilter(to, from) {
        this.sendNewQuery();
      },
      teacherPoints: function(newVal, oldVal) {
        this.enoughPoints = newVal > 0;
        this.weeksLeft = Math.ceil(newVal / 5);
      }
    },
  };

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
    @import "./default";

    .filter {
      margin-bottom: 10px;
    }

    .disabled {
        cursor: not-allowed !important;
        background-color: rgba(100,100,100,0.5);
    }

    .points-message {
      float: right;
      font-size: 0.8em;
    }
</style>
