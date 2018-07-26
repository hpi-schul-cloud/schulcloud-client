<template>
  <div>
    <div class="search-bar">
      <div id="search-input">
        <input id="search-query-input" v-model.lazy="searchQuery"
        placeholder="Suche nach..."/></br>
        <span id="resultHeadline"
        v-if="searchQuery"><b>{{this.pagination.totalEntrys}}</b> Ergebnisse für <b>"{{this.searchQuery}}"</b></span>
      </div>
      <div>
        <md-field>
          <label for="itemsPerPage">Einträge pro Seite</label>
          <md-select v-model.number="pagination.itemsPerPage" name="itemsPerPage" id="itemsPerPage">
            <md-option value=12>12</md-option>
            <md-option value=24>24</md-option>
            <md-option value=48>48</md-option>
            <md-option value=48>96</md-option>
          </md-select>
        </md-field>
      </div>
    </div>
    <div>
      <search-filter inReview="true" @newFilter="updateFilter"></search-filter>
    </div>
    <div md-gutter class="grid">
        <contentCard v-for="item in data" :key="item._id  + '#card'" v-bind:data="item['_source']" v-bind:contentId="item['_id']" v-bind:readOnly="readOnly"></contentCard>
    </div>

    <md-empty-state v-if="data.length == 0" class="md-primary"
                    md-icon="error_outline"
                    md-label="keine Ergebnisse gefunden"
                    md-description="Probiere es mit einem anderen Schlüsselwort oder anderen Filtern erneut.">
    </md-empty-state>
    <pagination @pageChanged="pageChanged" v-bind:config="pagination"></pagination>
  </div>
</template>

<script>
  import contentCard from './ContentCard.vue';
  import pagination from './helper/Pagination.vue';
  import filter from './Filter.vue';

  const qs = require('query-string');

  export default {
    components: {
      contentCard,
      'search-filter': filter,
      pagination,
    },
    name: 'ContentSearch',
    props: ['readOnly', 'inReview'],
    data() {
      return {
        data: [],
        searchQuery: '',
        apiFilterQuery: {},
        urlQuery: {},
        pagination: {
          page: 1,
          itemsPerPage: 12,
          totalEntrys: 0,
          buttonRange: 2,
          scroll: {
            top: 0,
            left: 0,
            behavior: 'smooth',
          },
        },
      };
    },
    created() {
      if (this.$router) {
        this.searchQuery = this.$route.query.q || '';
        this.pagination.page = parseInt(this.$route.query.p) || 1;
      } else {
        const query = qs.parse(location.search) || {};
        this.searchQuery = query.q || '';
        this.pagination.page = parseInt(query.p) || 1;
      }
      this.loadContent();
      window.onhashchange = this.urlChangeHandler;
    },
    methods: {
      pageChanged(page) {
        this.pagination.page = page;
        this.loadContent();
      },
      updateURL(newQuery) {
        if (this.$router) {
          this.$router.push({query: newQuery});
        } else if (history.pushState) {
          const newurl =
            `${window.location.protocol
              }//${
              window.location.host
              }${window.location.pathname
              }?${
              qs.stringify(newQuery)}`;
          window.history.pushState({path: newurl}, '', newurl);
        }
      },
      constructPathFromURL(urlQuery) {
        let queryString = '?limit=' + this.pagination.itemsPerPage + '&page=' + this.pagination.page;
        if (this.inReview) {
          queryString += 'only-non-approved=true&provider=Schul-Cloud';
        }
        Object.keys(urlQuery).forEach(function(key) {
            if (key !== 'p') {
              queryString += key + '=' + urlQuery[key] + '&';
            }
        });
        return queryString;
      },
      loadContent() {
        // clear data to show "loading state"
        const page = this.pagination.page || 1; // pagination for request
        const searchString = this.searchQuery || ''; // query for search request

        // set unique url
        this.urlQuery.term = searchString;
        this.urlQuery.p = page;
        this.updateURL(this.urlQuery);

        // build request path and fetch new data
        const searchQuery = {
          $limit: this.pagination.itemsPerPage,
          $skip: this.pagination.itemsPerPage * (page - 1),
          '_all[$match]': searchString,
        };

        const queryString = qs.stringify(Object.assign(searchQuery, this.apiFilterQuery));
        // let path = this.$config.API.searchPath;
        // if (searchString) {
        let path = this.$config.API.searchPath + this.constructPathFromURL(this.urlQuery);
        console.log(path);
        // }
        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + path, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            },
          })
          .then((response) => {
            this.data = response.body.hits.hits;
            this.pagination.totalEntrys = response.body.hits.total;
          })
          .catch((e) => {
            console.error(e);
          });
      },
      urlChangeHandler() {
        // handle url changes
        if (this.$router) {
          this.searchQuery = this.$route.query.q;
          this.pagination.page = parseInt(this.$route.query.p);
        } else {
          const query = qs.parse(location.search);
          if (this.searchQuery != query.q) {
            this.searchQuery = query.q;
          }
          if (this.pagination.page != parseInt(query.p)) {
            this.pagination.page = parseInt(query.p);
          }
        }
      },
      updateFilter(newApiQuery, newUrlQuery) {
        this.apiFilterQuery = newApiQuery;
        this.urlQuery = newUrlQuery;
        this.loadContent();
      },
      deleteEntry(id) {
        this.data.forEach((entry, index) => {
          if (entry._id == id) {
            this.data.splice(index, 1);
          }
        });
      },
    },
    watch: {
      searchQuery(to, from) {
        if (to != from) {
          if (from != '') {
            this.pagination.page = 1;
          }
          this.loadContent();
        }
      },
      'pagination.page': function (to, from) {
        if (to != from) {
          this.loadContent();
        }
      },
      'pagination.itemsPerPage': function (to, from) {
        if (to != from) {
          this.loadContent();
        }
      },
      selectedProviders(to, from) {
        if (to != from) {
          this.loadContent();
        }
      },
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .search-bar {
    display: flex;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    clear: both;
  }

  .content-card {
    padding: 5px;
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
    }
  }
</style>
