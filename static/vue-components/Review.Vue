<template>
  <div class="">
    <h1>Review eines Inhalts</h1>

    <div v-if="error" class="error-message">
      Fehler beim Laden des Inhalts. Eventuell wurde der Inhalt inzwischen entfernt.
      <br>
      <md-button class="md-raised md-accent">Zurück (tbd)</md-button>
    </div>

    <div v-else>
      <teacher-content class="teacher-content" :teacherContent="data" :external="external" @editor-update='editorUpdated' />
      <md-card class="stepper-card">
        <md-steppers :md-active-step.sync="active" md-linear>
          <md-step id="first" md-label="Inhalt bewerten" :md-done.sync="first">
            <rate-content :contentId="contentId" :contentChanged="contentChanged" @step="setDone('first', 'second')" @denied="onDenied" @accepted="onAccepted" />
          </md-step>

          <md-step id="second" md-label="Kategorien überprüfen" :md-done.sync="second">
            <categorize :teacherContent="data" />
            <md-button class="md-primary" @click="saveReview(true)">{{ categoriesChanged ? "Neue Kategorien vorschlagen" : "Kategorien bestätigen" }}</md-button>
          </md-step>

        </md-steppers>
      </md-card>
    </div>

  </div>
</template>

<script>
  import editContent from  './EditContent.vue';
  import teacherContent from  './TeacherContent.vue';
  import categorize from  './Categorize.vue';
  import rateContent from  './RateContent.vue';

  export default {
    components: {
      'edit-content': editContent,
      'teacher-content': teacherContent,
      'categorize': categorize,
      'rate-content': rateContent
    },
    name: 'Review',
    data() {
      return {
        contentId: window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1),
        data: {},
        external,
        oldTitle: '',
        oldContent: '',
        oldSubjects: [],
        oldTopics: [],
        oldAge: 0,
        oldAgeRange: 0,
        oldDifficulty: '',
        oldGoal: '',
        active: 'first',
        first: false,
        second: false,
        rating: {},
        error: false,
      };
    },
    props: ['userId'],
    computed: {
      contentChanged: function () {
        if (!this.isEmptyObject(this.data)) {
          return (this.data.title != this.oldTitle) || (this.data.content != this.oldContent)
        }
        else {
          return false;
        }
      },
      categoriesChanged: function () {
        if (!this.isEmptyObject(this.data)) {
          return !(this.data.subjects.length === this.oldSubjects.length && this.data.subjects.every((value, index) => value === this.oldSubjects[index])) || (this.data.topics != this.oldTopics) || (this.data.age != this.oldAge) || (this.data.ageRange != this.oldAgeRange) || (this.data.difficulty != this.oldDifficulty) || (this.data.goal != this.oldGoal);
        }
        else {
          return false;
        }
      },
    },
    created() {
      this.loadContent();
    },
    methods: {
      loadContent() {
        if (this.contentId === 'external') {
          this.external = true;
          return;
        }
        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + '/content/resources/' + this.contentId, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            },
          })
          .then((response) => {
            this.data = response.body;
            this.oldTitle = this.data.title;
            this.oldContent = this.data.content;
            this.oldSubjects = this.data.subjects.slice();
            this.oldTopics = this.data.topics;
            this.oldAge = this.data.age;
            this.oldAgeRange = this.data.ageRange;
            this.oldDifficulty = this.data.difficulty;
            this.oldGoal = this.data.goal;
          })
          .catch((e) => {
            this.error = true;

            console.error(e);
          });
      },
      editorUpdated(content) {
        this.data.content = content;
      },
      setDone (id, index) {
        this[id] = true;

        if (index) {
          this.active = index
        }
      },
      isEmptyObject(obj) {
        return !Object.keys(obj).length;
      },
      onDenied: function(reviewText) {
        this.rating.text = reviewText;
        this.saveReview(false);
      },
      onAccepted: function(rating) {
        this.rating = rating;
      },
      saveReview: function(accepted) {
        this.rating.userId = this.userId;
        const dataToSend = {
          id: this.contentId,
          rating: this.rating,
          approved: accepted,
          userId: this.userId
        }
        if (this.categoriesChanged) {
          dataToSend.categories = {
            subjects: this.data.subjects,
            topics: this.data.topics,
            age: this.data.age,
            difficulty: this.data.difficulty,
            goal: this.data.goal,
            userId: this.userId
          };
        }
        if (this.contentChanged) {
          dataToSend.content = this.data.content;
        }
        const loaderClassList = document.querySelector(".preload-screen").classList;
        loaderClassList.remove("hidden");
        this.$http
          .patch(this.$config.API.baseUrl + this.$config.API.port + '/content/resources/' + this.contentId, dataToSend, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            }
          })
          .then((response) => {
            setTimeout(() => {
              loaderClassList.add("hidden");
              location.href = '/content/review/?msg=Review erfolgreich gespeichert. Sie haben 5 Punkte erhalten. Glückwunsch!';
            }, 3000); // Wait so elasticsearch knows about the new review when it is asked for it after redirection
          })
          .catch((e) => {
            console.error(e);
          });
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .teacher-content {
    margin-bottom: 2em;
  }

</style>
