<template>
  <div>
    <h1>Materialen-Übersicht</h1>

    <div class="count-row">
      <md-content class="count-box"><div><span class="number">{{contentCount}}</span>Inhalte in der Schul-Cloud</div></md-content>
      <md-content class="count-box"><div><span class="number">{{teacherContentCount}}</span>davon wurden von Kolleg*Innen erstellt</div></md-content>
      <md-content class="count-box"><div><span class="number">{{approvedTeacherContentCount}}</span>davon wurden vom Kollegium akzeptiert</div></md-content>
    </div>
    <div class="link-row">
      Mehr: Zur <a href="/content/search">Suche</a> und zum <a href="/content/review">Review</a>
    </div>
    <div class="count-row">
      <md-content class="count-box"><div><span class="number">{{ownContentCount}}</span>Inhalte haben Sie erstellt</div></md-content>
      <md-content class="count-box"><div><span class="number">{{ownPublishedContentCount}}</span>davon ihren Kolleg*Innen zur Verfügung gestellt</div></md-content>
      <md-content class="count-box"><div><span class="number">{{ownApprovedContentCount}}</span>davon wurden akzeptiert</div></md-content>
    </div>
    <div class="link-row">
      Mehr: <a href="/content/create">Neue Inhalte erstellen</a> (und veröffentlichen) oder zu den <a href="/content/my-content">eigenen Inhalten</a>
    </div>

  </div>
</template>

<script>
  import contentCard from './ContentCard.vue';

  export default {
    components: {
      contentCard,
    },
    name: 'MyContent',
    data() {
      return {
        contentCount: 1234,
        teacherContentCount: 321,
        approvedTeacherContentCount: 213,
        ownContentCount: 13,
        ownPublishedContentCount: 3,
        ownApprovedContentCount: 2,
      };
    },
    created() {
      this.loadContent();
    },
    methods: {
      loadContent() {
        // TODO: get numbers from server
        // let path = this.$config.API.searchPath + '?limit=9999&userId=0000d231816abba584424242'; // TODO: actual user id
        // console.log(this.$config.API.baseUrl + this.$config.API.port + path);
        // this.$http
        //   .get(this.$config.API.baseUrl + this.$config.API.port + path, {
        //     headers: {
        //       Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
        //     },
        //   })
        //   .then((response) => {
        //     this.data = response.body.hits.hits;
        //   })
        //   .catch((e) => {
        //     console.error(e);
        //   });
      },
    },
    watch: {
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";
  .count-row {
    display: flex;
  }

  .md-content {
    width: 150px;
    height: 150px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin: 25px;
    padding: 25px

  }

  .count-box {
    background-color: #B10438 !important;
    color: white !important;
  }
  .count-box .number {
    font-size: 1.5em;
    font-weight: bold;
  }
  .count-box div {
    text-align: center;
    font-weight: 500;
  }
  .count-box span {
    display: block;
    margin-bottom: 5px;
  }

  .link-row {
    background-color: #FF8830;
    margin-left: 25px;
    margin-bottom: 10px;
    padding: 10px 25px;
    width: 550px;
    color: wheat;
    font-weight: bold;
  }
</style>
