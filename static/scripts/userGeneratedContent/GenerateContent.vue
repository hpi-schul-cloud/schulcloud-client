<template>
  <div>
    <md-steppers :md-active-step.sync="active" md-alternative md-linear> <!-- md-vertical -->
      <md-step id="first" md-label="Inhalt erstellen" md-description="Alpha-Test" :md-done.sync="first">
        <p>Hier bitte Ihren Inhalt einfügen (im Moment geht nur Text, der BP-Editor sollte dann bald hier eingebunden werden).</p>

        <md-field>
          <label>Inhalt</label>
          <md-textarea v-model="content"></md-textarea>
        </md-field>

        <br>
        <md-button class="md-raised md-primary" @click="setDone('first', 'second')">Continue</md-button>
      </md-step>

      <md-step id="second" md-label="Inhalt kategorisieren" :md-error="secondStepError" :md-done.sync="second">
        <Categorize class="card" @categories-accepted="accepted" :data="data" :review="review"></Categorize>
        <md-button class="md-raised md-primary" @click="setDone('second', 'third')">Continue</md-button>
      </md-step>

      <md-step id="third" md-label="Fertigstellen" :md-done.sync="third">
        <p>Sie können den eben erstellten Inhalt einfach speichern, können nur Sie ihn in Ihren Kursen verwenden.
           Wenn Sie sich ihn veröffentlichen, können auch andere Lehrer*Innen von Ihrem Inhalt profitieren -
           gleichzeitig erhalten Sie Punkte, mit denen Sie auf eine verbesserte Suchen
           zurückgreifen können. Erfahren Sie <a href="#">hier</a> mehr.</p>
        <md-switch v-model="publish">
          Veröffentlichen
        </md-switch>
        <md-button class="md-raised md-primary" @click="setDone('third')">Speichern</md-button>
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
      active: 'first',
      first: false,
      second: false,
      third: false,
      secondStepError: null,
      data: {
        topics: ['Todo'],
        age: "8 +- 1",
        subjects: ["Deutsch", "Englisch", "Geschichte"],
        difficulty: ["A2", "B1"],
        goal: ["Einführung"],
      },
      showRating: true,
      review: true,
      publish: true,
      content: '',
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

        if (id === 'third') {
          alert(this.content + '       ' + this.data)
        }

        if (index) {
          this.active = index
        }
      }
    }
  }
</script>

<style lang="css">
  .md-switch-container {
    background-color: rgba(255,82,82,.38);
  }

  .md-switch-thumb {
    background-color: #ff5252;
  }
</style>
