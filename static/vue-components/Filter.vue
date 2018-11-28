<template>
  <div class="filter" v-on:getFilter="sendNewQuery">
    <md-chip v-for="chip in activeFilter" v-model="activeFilter" :key="chip[0]" v-on:click="visibleFilter = chip[0]"
             @md-delete.stop="removeFilter(chip[0], true)" md-clickable md-deletable>{{ chip[1].displayString }}
    </md-chip>

    <md-menu md-direction="bottom-end">
      <md-button md-menu-trigger class="add-filter">
        <md-icon><i class="material-icons">add</i></md-icon>
        {{addLabel}}
      </md-button>
      <md-menu-content>
        <md-menu-item v-for="(filter, index) in availableFilter"
                      :key="('Option-' + '#' + index + '-' + filter.type + '-' + filter.property)"
                      v-if="!isApplied('#' + index + '-' + filter.type + '-' + filter.property)"
                      v-on:click="visibleFilter = ('#' + index + '-' + filter.type + '-' + filter.property)">
                      {{filter.title}}...
        </md-menu-item>
      </md-menu-content>
    </md-menu>

    <component v-for="(filter, index) in availableFilter"
               :key="('Dialog-' + '#' + index + '-' + filter.type + '-' + filter.property)"
               v-bind:is="filter.type"
               v-bind:active="visibleFilter == ('#' + index + '-' + filter.type + '-' + filter.property)"
               :identifier="('#' + index + '-' + filter.type + '-' + filter.property)"
               :config="filter"
               @set="setFilter"
               @cancle="cancle"/>
  </div>
</template>

<script>
  import selectPicker from './dialogs/filter/select.vue';
  import datePicker from './dialogs/filter/date.vue';
  import sortPicker from './dialogs/filter/sort.vue';
  import booleanPicker from './dialogs/filter/boolean.vue';
  import limitPicker from './dialogs/filter/limit.vue';
  const qs = require('query-string');

  export default {
    components: {
      'filter-select': selectPicker,
      'filter-date': datePicker,
      'filter-sort': sortPicker,
      'filter-boolean': booleanPicker,
      'filter-limit': limitPicker
    },
    props: {
      "addLabel": {type: String, default: "add filter"},
      "applyLabel": {type: String, default: "apply"},
      "cancleLabel": {type: String, default: "cancle"},
      "handleUrl": { type: Boolean, default: false },
      "saveState": { type: Boolean, default: false },
      "filter": { type: String, default: "[]" },
    },
    name: 'searchFilter',
    data() {
      return {
        visibleFilter: '',
        activeFilter: [],
        availableFilter: [],
        isWatching: true,
        pageIdentifier: `ffilter-${window.location.origin} + ${window.location.pathname}`,
      };
    },
    created(){
      this.availableFilter = JSON.parse(this.filter).map((filter)=>{
        filter.type = "filter-"+filter.type;
        return filter;
      });
    },
    mounted(){
      if(this.handleUrl){
        window.onhashchange = this.newUrlQuery;
      }
      if(this.saveState){
        const savedState = localStorage.getItem(this.pageIdentifier);
        if(savedState){
          window.history.replaceState(null , null, savedState);
        }
      }
      this.newUrlQuery();
    },
    methods: {
      setFilter(identifier, filterData) {
        this.visibleFilter = '';

        filterData = JSON.parse(JSON.stringify(filterData)); // deep copy

        this.removeFilter(identifier, false);
        this.activeFilter.push([identifier, filterData]);
        this.activeFilter.sort((a, b) => {
          const idA = a[0].match(/[#]{1}([0-9]+)[-]{1}/)[1]
          const idB = b[0].match(/[#]{1}([0-9]+)[-]{1}/)[1]
          return idA - idB;
        });
      },
      removeFilter(key, emit) {
        this.activeFilter = this.activeFilter.filter(item => item[0] != key);
        if (emit) {
          this.$emit('reset', key);
        }
      },
      cancle() {
        this.visibleFilter = '';
      },
      sendNewQuery() {
        const apiQuery = {};
        const urlQuery = {};
        this.activeFilter.forEach((value) => {
          Object.assign(apiQuery, value[1].apiQuery);
          Object.assign(urlQuery, value[1].urlQuery);
        }, {});
        if (this.handleUrl && history.pushState) {
          window.history.replaceState(null , null, `#?${qs.stringify(urlQuery)}`);
        }
        if(this.saveState){
          localStorage.setItem(this.pageIdentifier, window.location.hash);
        }

        this.$emit('newFilter', apiQuery, urlQuery, qs.stringify(apiQuery), qs.stringify(urlQuery));
      },
      isApplied(identifier) {
        return this.activeFilter.map(i => i[0]).includes(identifier);
      },
      newUrlQuery(){
        this.isWatching = false;
        this.activeFilter = [];
        this.isWatching = true;
        this.$emit('reset');
        this.$emit('newUrlQuery', (qs.parse(location.hash.slice(1)) || {}));
      }

    },
    watch: {
      activeFilter(to, from) {
        if(this.isWatching){
          this.sendNewQuery();
        }
      },
    },
  };

</script>

<style lang="scss" scoped>
/* ENTER CUSTOM CSS HERE */
.add-filter{
  vertical-align: middle;
  margin-bottom: 8px;
}
.md-chip{
  margin-bottom: 8px;
}
</style>
