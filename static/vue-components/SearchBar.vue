<template>
  <div>
    <div class="search-bar">
      <div id="search-input">
        <input id="search-query-input" v-model.lazy="searchQuery"
        placeholder="Suche nach..."/></br>
        <span id="resultHeadline">
          <b>{{this.pagination.totalEntrys}}</b> Ergebnisse <span v-if="searchQuery">für <b>"{{this.searchQuery}}"</b></span>
        </span>
      </div>
    </div>
    <div>
      <search-filter addLabel="Filter hinzufügen" :filter="JSON.stringify(filter)" @newFilter="updateFilter" :handleUrl="true" />
    </div>
  </div>
</template>

<script>
  import filter from './filter.vue';

  const qs = require('query-string');

  export default {
    components: {
      'search-filter': filter
    },
    name: 'SearchBar',
    props: ['inReview', 'userId', 'pagination', 'gamification', 'initialSearchQuery'],
    data() {
      return {
        filter: [
          {
            type: "sort",
            title: 'Sortierung',
            displayTemplate: 'Sortieren nach: %1',
            options: [
              ["updatedAt", "Aktualität"],
              ["providerName", "Anbieter"],
              ["clickCount", "Beliebtheit"]
            ],
            defaultOrder: "DESC"
          },
          {
            type: "limit",
            title: 'Einträge pro Seite',
            displayTemplate: 'Einträge pro Seite: %1',
            options: [12, 24, 48, 96],
            defaultSelection: 12
          },
          {
            type: "select",
            title: 'Dateityp',
            displayTemplate: 'Dateitypen: %1',
            property: 'mimeType',
            multiple: true,
            expanded: true,
            options: [
              ["text/html", "Text"],
              ["video", "Video"]
            ]
          },
        ],
        searchQuery: '',
        apiQuery: {},
        urlQuery: {}
      };
    },
    created(){
      this.searchQuery = this.initialSearchQuery;
    },
    methods: {
      updateFilter(apiQuery, urlQuery) {
        this.apiQuery = apiQuery;
        this.urlQuery = urlQuery;
        this.$emit('newSearch', apiQuery, urlQuery, this.searchQuery);
      },
    },
    watch: {
      searchQuery(to, from) {
        if (to != from) {
          this.pagination.page = 1;
          this.$emit('newSearch', this.apiQuery, this.urlQuery, this.searchQuery);
        }
      },
      initialSearchQuery(to, from) {
        if(to !== from && to !== this.searchQuery){
          this.searchQuery = to;
        }
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  @import "./default";
  .search-bar {
    display: flex;
  }

  #search-input {
    font-size: 1.75em;
    margin-top: 16px;
    float: left;
    width: calc(100% - 200px);
    margin-bottom: 16px;
    #search-query-input {
      display: inline-block;
      font-size: 1em;
      line-height: 1em;
      width: 100%;
      max-width: 500px;
      padding: 0;
      margin: 0;
      margin-left: 5px;
      outline: none;
      background: transparent;
      border: none;
      color: inherit;
      border-bottom: 1px solid grey;
      &:focus {
        color: var(--md-theme-default-primary);
        border-bottom: 1px solid var(--md-theme-default-primary);
      }
    }
    #resultHeadline {
      font-size: 1rem;
      display: block;
      margin-left: 5px;
    }
  }

</style>
