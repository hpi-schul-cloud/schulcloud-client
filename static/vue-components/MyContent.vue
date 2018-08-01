<template>
  <div>
    <h1>Meine Materialen</h1>
    <div md-gutter class="grid">
        <contentCard v-for="item in data" :key="item._id  + '#card'" :data="item['_source']" :contentId="item['_id']" :ownContent="true"></contentCard>
    </div>

    <md-empty-state v-if="data.length == 0" class="md-primary"
                    md-icon="error_outline"
                    md-label="Keine eigenen Materialen vorhanden"
                    md-description="Erstellen Sie gleich Ihren ersten eigenen Inhalt in der Schul-Cloud.">
    </md-empty-state>
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
        data: [],
      };
    },
    created() {
      this.loadContent();
    },
    methods: {
      loadContent() {

        let path = this.$config.API.searchPath + '?limit=9999&userId=0000d231816abba584424242'; // TODO: actual user id
        console.log(this.$config.API.baseUrl + this.$config.API.port + path);
        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + path, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            },
          })
          .then((response) => {
            this.data = response.body.hits.hits;
          })
          .catch((e) => {
            console.error(e);
          });
      },
    },
    watch: {
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    clear: both;
  }

  .content-card {
    padding: 5px;
  }
</style>
