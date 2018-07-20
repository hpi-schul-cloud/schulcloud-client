<template>
  <div>
    <!--<md-field id="search-input">
        <label>{{$lang.searchContent.search_for}}</label>
        <md-input v-model="searchQuery"></md-input>
    </md-field>-->
    <div id="search-input">
      <input id="search-query-input" v-model.lazy="searchQuery"
             placeholder="Suche nach..."/></br>
      <span id="resultHeadline"
            v-if="searchQuery"><b>{{this.pagination.totalEntrys}}</b> Ergebnisse für <b>"{{this.searchQuery}}"</b></span>
    </div>

    <div class="md-layout">
      <search-filter @newFilter="updateFilter"></search-filter>
    </div>

    <div class="md-layout-item items-per-page-picker">
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

    <div md-gutter v-show="gutter" class="grid">
      <div class="card-wrapper" v-for="item in data"
           :key="item._id  + '#card'">
        <contentCard v-bind:data="item" v-bind:readOnly="readOnly"></contentCard>
      </div>
    </div>
    <!-- <table v-show="!gutter" v-if="tableEnabled && readOnly != true">
      <thead>
      <tr>
        <th>Titel</th>
        <th>URL</th>
        <th class="hide-s">Lizenz</th>
        <th class="hide-m">Kategorie</th>
      </tr>
      </thead>
      <contentRow v-for="item in data" :key="item._id + '#table'" v-bind:contentData="item"
                  @delete="deleteEntry"></contentRow>
    </table> -->
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
    name: 'contentList',
    props: ['readOnly'],
    data() {
      return {
        data: [],
        gutter: true,
        tableEnabled: false,
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
      loadContent() {
        // clear data to show "loading state"
        const page = this.pagination.page || 1; // pagination for request
        const searchString = this.searchQuery || ''; // query for search request

        // set unique url
        this.urlQuery.q = searchString;
        this.urlQuery.p = page;
        this.updateURL(this.urlQuery);

        // build request path and fetch new data
        const searchQuery = {
          $limit: this.pagination.itemsPerPage,
          $skip: this.pagination.itemsPerPage * (page - 1),
          '_all[$match]': searchString,
        };

        const queryString = qs.stringify(Object.assign(searchQuery, this.apiFilterQuery));
        const path =
          searchString.length == 0
            ? this.$config.API.getPath
            : `${this.$config.API.searchPath}?${queryString}`;
        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + path, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt')}`, 
            },
          })
          .then((response) => {
            this.data = response.data.data;
            this.pagination.totalEntrys = response.data.total;
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
<style lang="scss" scoped>
  @import "./default";

  .items-per-page-picker {
    margin-left: 7px;
    float: right;
  }

  .md-layout {
    width: 100%;
    margin-bottom: 5px;
  }

  .md-layout-item {
    margin-right: 5px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    clear: both;
  }

  .card-wrapper {
    padding: 5px;
    // box-sizing: border-box;
  }

  table {
    width: 100%;
  }

  #search-input {
    font-size: 1.75em !important;
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
