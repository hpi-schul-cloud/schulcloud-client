<template>
  <div class="">
    <h1>Review eines Inhalts</h1>

    <teacher-content :teacherContent="data" />

    <md-steppers :md-active-step.sync="active" md-alternative>
      <md-step id="first" md-label="Inhalt bewerten" :md-done.sync="first">
        <rate-content :contentId="contentId" :contentChanged="contentChanged" />
      </md-step>

      <md-step id="second" md-label="Kategorien überprüfen" :md-done.sync="second">
        <categorize :teacherContent="data" />
        <md-button class="md-primary" @click="">{{ categoriesChanged ? "Neue Kategorien vorschlagen" : "Kategorien bestätigen" }}</md-button>
      </md-step>

    </md-steppers>

  </div>
</template>

<script>
  import teacherContent from  './TeacherContent.vue';
  import categorize from  './Categorize.vue';
  import rateContent from  './RateContent.vue';

  export default {
    components: {
      'teacher-content': teacherContent,
      'categorize': categorize,
      'rate-content': rateContent
    },
    name: 'Review',
    data() {
      return {
        contentId: window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1),
        data: {},
        oldTitle: '',
        oldContent: '',
        oldSubjects: [],
        oldTopics: [],
        oldAge: 0,
        oldDifficulty: '',
        oldGoal: '',
        active: 'first',
        first: false,
        second: false,
      };
    },
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
          return !(this.data.subjects.length === this.oldSubjects.length && this.data.subjects.every((value, index) => value === this.oldSubjects[index])) || (this.data.topics != this.oldTopics) || (this.data.age != this.oldAge) || (this.data.difficulty != this.oldDifficulty) || (this.data.goal != this.oldGoal);
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
            this.oldDifficulty = this.data.difficulty;
            this.oldGoal = this.data.goal;
          })
          .catch((e) => {
            console.error(e);
          });
      },
      setDone (id, index) {
        this[id] = true;

        if (index) {
          this.active = index
        }
      },
      isEmptyObject(obj) {
        return !Object.keys(obj).length;
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .md-card {
    margin-bottom: 10px;
    padding: 10px 20px;
  }

  .md-steppers {
    margin-top: 4em;
  }

</style>
