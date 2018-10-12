<template>
  <div>
    <md-card class="stepper-card">
      <md-steppers :md-active-step.sync="active" md-alternative md-linear> <!-- md-vertical -->
        <md-step id="first" md-label="Inhalt erstellen" md-description="Alpha-Test" :md-done.sync="first">
          <md-field>
            <label>Titel</label>
            <md-input v-model="title"></md-input>
          </md-field>
          <md-field>
            <label>Beschreibung</label>
            <md-textarea v-model="description"></md-textarea>
          </md-field>
          <edit-content @editor-update='editorUpdated' />
          </md-field>

          <br>
          <md-button class="md-primary" @click="setDone('first', 'second')">Weiter zum Veröffentlichen</md-button>
          <md-button @click="askSave()">Speichern ohne Veröffentlichen</md-button>
          <md-dialog-confirm
            :md-active.sync="dialogActive"
            md-title="Inhalt veröffentlichen"
            md-content="Helfen Sie, eine qualitativ hochwertige Materialsammlung aufzubauen, indem Sie ihren Inhalt mit anderen teilen!<br><br>Das dauert <strong>weniger als 3 Minuten</strong>. Sie profitieren auch davon, denn dann können Sie eine passgenaue Suche guter Inhalte nutzen, die Ihre Kolleg*Innen zur Verfügung gestellt haben."
            md-confirm-text="Kategorisieren und veröffentlichen"
            md-cancel-text="Nur speichern"
            @md-cancel="publish(true)"
            @md-confirm="setDone('first', 'second')" />

        </md-step>

        <md-step id="second" md-label="Inhalt kategorisieren" :md-error="secondStepError" :md-done.sync="second">
          <Categorize :teacherContent="categories" :review="review" @categories-status-changed="onCategoriesStatusChanged"></Categorize>
          <md-button class="md-raised md-primary" @click="publish(false)">Veröffentlichen</md-button>
          <div v-if="msg" class="alert alert-danger">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            {{ msg }}
          </div>
        </md-step>

      </md-steppers>
    </md-card>
  </div>
</template>

<script>
  import Categorize from './Categorize.vue';
  import EditContent from './EditContent.vue';


  export default {
    name: 'CreateContent',
    components: {
      Categorize,
      'edit-content': EditContent
    },
    data: () => ({
      dialogActive: false,
      active: 'first',
      first: false,
      second: false,
      third: false,
      msg: undefined,
      secondStepError: null,
      categories: {
        topics: [],
        age: undefined,
        ageRange: undefined,
        subjects: [],
        difficulty: undefined,
        goal: undefined,
      },
      categoriesComplete: false,
      showRating: true,
      review: true,
      content: '',
      title: '',
      description: '',
    }),
    props: ['userId'],
    methods: {
      editorUpdated(htmlContent) {
        this.content = htmlContent;
      },
      setDone (id, index) {
        this[id] = true;
        if (index) {
          this.active = index
        }
      },
      askSave() {
        // TODO: Only ask the first time/save this info in cookie?
        this.dialogActive = true;
      },
      publish(onlyPrivat) {
        if (!onlyPrivat && !this.categoriesComplete) {
          this.msg = "Bitte alle Kategorien angeben";
          return;
        }
        var imgStart = this.content.indexOf('src="') + 5;
        var imgEnd = this.content.indexOf('"', imgStart);
        var thumbnail = this.content.substring(imgStart, imgEnd);
        console.log(thumbnail);
        var dataToSend = {
          userId: this.userId,
          title: this.title,
          description: this.description,
          thumbnail: thumbnail,
          content: this.content,
          topics: this.categories.topics,
          subjects: this.categories.subjects,
          goal: this.categories.goal,
          age: this.categories.age,
          ageRange: this.categories.ageRange,
          difficulty: this.categories.difficulty,
          isPrivat: onlyPrivat
        };

        console.log(dataToSend);
        const loaderClassList = document.querySelector(".preload-screen").classList;
        loaderClassList.remove("hidden");

        this.$http
          .post(this.$config.API.baseUrl + this.$config.API.port + '/content/resources', dataToSend, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            }
          })
          .then((response) => {
            let msg = onlyPrivat ? 'Inhalt erfolgreich erstellt. Sie finden Ihn unter "Meine Materialien" oder können ihn unter "Kurse" auswählen.' : "Inhalt erfolgreich erstellt und geteilt. Sie erhalten sofort 10 Punkte. Wenn Kolleg*Innen Ihren Inhalt bestätigen, erhalten sie 50 weitere Punkte.";
            setTimeout(() => {
              loaderClassList.add("hidden");
              location.href = '/content/my-content?msg=' + msg;
            }, 3000); // Wait so elasticsearch knows about the new content when it is asked for it after redirection
            console.log(response);
          })
          .catch((e) => {
            console.error(e);
            alert("Fehler beim Erstellen. Entschuldigung! Bitte probieren Sie es später noch mal.")
          });
      },
      onCategoriesStatusChanged(categoriesComplete) {
        this.categoriesComplete = categoriesComplete;
      }
    }
  }
</script>

<style lang="scss">

  @import "./default";

  .md-switch-container {
    background-color: rgba(255,82,82,.38);
  }

  .md-switch-thumb {
    background-color: #ff5252;
  }
</style>
