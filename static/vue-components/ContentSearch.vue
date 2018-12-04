<template>
  <div>
    <section class="section-title">
      <div v-if="msg" class="alert alert-success">
        <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
        {{ msg }}
      </div>
      <div class="row" id="titlebar">
        <div class="col-sm-9">
          <div>
              <h4>{{heading}}</h4>
          </div>
        </div>
      </div>
    </section>
    <search-bar @newSearch="newSearch" :pagination="pagination" :inReview="inReview" :userId="userId" :gamification="false" :initialSearchQuery="this.searchQuery"/>
    <div md-gutter class="grid">
        <contentCard v-for="item in data" :key="item._id  + '#card'" :inReview="inReview" :data="item" :contentId="item['_id']"></contentCard>
    </div>

    <md-empty-state v-if="data.length == 0" class="md-primary"
                    md-icon="error_outline"
                    :md-label="searching ? 'Wird geladen' : 'Keine Ergebnisse gefunden'"
                    :md-description="searching ? 'Bitte haben Sie einen Moment Geduld.' : 'Probiere es mit einem anderen Schlüsselwort oder anderen Filtern erneut.'">
    </md-empty-state>
    <pagination @pageChanged="pageChanged" v-bind:config="pagination"></pagination>
  </div>
</template>

<script>
  import contentCard from './ContentCard.vue';
  import searchBar from './SearchBar';
  import pagination from './helper/Pagination.vue';

  const qs = require('query-string');

  export default {
    components: {
      contentCard,
      'search-bar': searchBar,
      pagination,
    },
    name: 'ContentSearch',
    props: ['inReview', 'heading', 'userId', 'task', 'passedMessage'],
    data() {
      return {
        data: [],
        msg: undefined,
        searchQuery: '',
        watchSearchQuery: true,
        apiFilterQuery: {},
        urlQuery: {},
        pagination: {
          page: 1,
          itemsPerPage: 12,
          totalEntrys: 0,
          scroll: {
            top: 0,
            left: 0,
            behavior: 'smooth',
          },
        },
      };
    },
    created() {
      var query = qs.parse(window.location.href.substring(window.location.href.indexOf('?')+1));
      this.msg = query.msg || this.passedMessage ;

      this.watchSearchQuery = false;
      this.searchQuery = query.term || '';
      this.pagination.page = parseInt(query.page || 0);
      this.watchSearchQuery = true;

      this.loadContent();

    },
    methods: {
      newSearch(apiQuery, urlQuery, searchQuery) {
        console.log("new search emitted");
        this.apiFilterQuery = apiQuery;
        this.urlQuery = urlQuery;
        this.searchQuery = searchQuery;
        this.pagination.itemsPerPage = apiQuery["$limit"] || this.pagination.itemsPerPage;
        this.loadContent();
      },
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
        let queryString = '?limit=' + this.pagination.itemsPerPage + /* '&userId=' + this.userId +*/ '&';
        if (this.task) {
          queryString += 'task=' + this.task + '&';
        } else if (urlQuery.term){
          queryString += '_all[$match]=' + urlQuery.term + '&';
        } else {
          queryString += 'task=search&';
        }
        urlQuery["_all[$match]"] = urlQuery.term;
        delete urlQuery.term;
        delete urlQuery.page;
        Object.keys(urlQuery).forEach(function(key) {
          queryString += key + '=' + urlQuery[key] + '&';
        });
        return queryString;
      },
      loadContent() {
        // clear data to show "loading state"
        this.data = [];
        this.searching = true;
        const page = this.pagination.page || 1;
        console.log("Loading for page", page);
        const searchString = this.searchQuery || '';

        // set unique url
        this.urlQuery.term = searchString;
        this.urlQuery.page = page;

        this.updateURL(this.urlQuery);

        //let path = this.$config.API.searchPath + this.constructPathFromURL(this.urlQuery);
        let path = this.$config.API.searchPath + `?$limit=${this.pagination.itemsPerPage}&$skip=${this.pagination.itemsPerPag * (this.pagination.page - 1)}${searchString?`&_all[$match]=${searchString}`:''}`;

        let jwt
        try{
          jwt = document.cookie.split(';').find((cookie) => { return cookie.includes('jwt');}).split('=')[1];
        } catch (error) {
          console.error("not authenticated")
        }

        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + path, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          })
          .then((response) => {
            this.data = response.body.data;
            this.pagination.totalEntrys = response.body.total;
          })
          .catch((e) => {
            console.error("CATCH",e);
          })
          .finally(() => {
            this.searching = false
          });
      },
      updateFilter(newApiQuery, newUrlQuery) {
        console.log("URL-Query from filter module: ");
        console.log(newUrlQuery);
        this.apiFilterQuery = newApiQuery;
        this.urlQuery = newUrlQuery;
        this.loadContent();
      },
    },
    watch: {
      searchQuery(to, from) {
        if (to != from && this.watchSearchQuery) {
          this.pagination.page = 1;
          this.loadContent();
        }
      },
      'pagination.page': function (to, from) {
        if (to != from && this.watchSearchQuery) {
          this.loadContent();
        }
      },
      'pagination.itemsPerPage': function (to, from) {
        if (to != from) {
          this.loadContent();
        }
      }
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
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-gap: 10px;
    clear: both;
  }

  @media only screen and (max-width: 1300px) {
    .grid {
        grid-template-columns: 1fr 1fr 1fr;
    }
  }

  @media only screen and (max-width: 900px) {
    .grid {
        grid-template-columns: 1fr 1fr;
    }
  }

  @media only screen and (max-width: 600px) {
    .grid {
        grid-template-columns: 1fr;
        grid-gap: 0;
    }
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
