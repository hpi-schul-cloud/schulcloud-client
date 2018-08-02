<template>
  <div>
    <md-steppers :md-active-step.sync="active" md-alternative md-linear> <!-- md-vertical -->
      <md-step id="first" md-label="Inhalt erstellen" md-description="Alpha-Test" :md-done.sync="first">
        <p>Hier bitte Ihren Inhalt einfügen (im Moment geht nur Text, der BP-Editor sollte dann bald hier eingebunden werden).</p>

        <md-field>
          <label>Titel</label>
          <md-input v-model="title"></md-input>
        </md-field>
        <md-field>
          <label>Beschreibung</label>
          <md-textarea v-model="description"></md-textarea>
        </md-field>
        <md-field>
          <label>Inhalt</label>
          <md-textarea v-model="content"></md-textarea>
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
        <Categorize class="card" :teacherContent="data" :review="review"></Categorize>
        <md-button class="md-raised md-primary" @click="publish(false)">Veröffentlichen</md-button>
      </md-step>

    </md-steppers>
  </div>
</template>

<script>
  import Categorize from './Categorize.vue';

  export default {
    name: 'CreateContent',
    components: {
      Categorize
    },
    data: () => ({
      dialogActive: false,
      active: 'first',
      first: false,
      second: false,
      third: false,
      secondStepError: null,
      data: {
        topics: [],
        age: undefined,
        ageRange: undefined,
        subjects: [],
        difficulty: undefined,
        goal: undefined,
      },
      showRating: true,
      review: true,
      content: '',
      title: '',
      description: '',
    }),
    methods: {
      setDone (id, index) {
        this[id] = true;
        if (id === "second" && !(this.data.age && this.data.subjects && this.data.difficulty && this.data.goal) ) {
          this.secondStepError = 'Bitte alle Kategorien angeben.';
          return;
        } else {
          this.secondStepError = null
        }
        if (index) {
          this.active = index
        }
      },
      askSave() {
        // TODO: Only ask the first time/save this info in cookie?
        this.dialogActive = true;
      },
      publish(onlyPrivat) {
        var dataToSend = {
          title: this.title,
          description: this.description,
          content: this.content,
          topics: this.data.topics,
          subjects: this.data.subjects,
          goal: this.data.goal,
          age: this.data.age,
          ageRange: this.data.ageRange,
          difficulty: this.data.difficulty,
          isPrivat: onlyPrivat
        };

        console.log(dataToSend);

        this.$http
          .post(this.$config.API.baseUrl + this.$config.API.port + '/content/resources', dataToSend, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            }
          })
          .then((response) => {
            location.href = '/content/';
            console.log(response);
          })
          .catch((e) => {
            console.error(e);
            alert("Fehler beim Erstellen. Entschuldigung! Bitet probieren Sie es später noch mal.")
          });
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
