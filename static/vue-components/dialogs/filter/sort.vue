<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>{{config.title}}</md-dialog-title>

    <div id="selection-picker">
      <md-field>
        <label for="options">{{config.title}}</label>
        <md-select v-model="selection" id="options">
          <md-option v-for="option in config.options"
                     :key="option[0]"
                     :value="JSON.stringify(option)">
            {{option[1]}}
          </md-option>
        </md-select>
      </md-field>
      <md-button v-show="desc" @click="desc = false" class="md-icon-button">
        <md-icon>arrow_downward</md-icon>
      </md-button>
      <md-button v-show="!desc" @click="desc = true" class="md-icon-button">
        <md-icon>arrow_upward</md-icon>
      </md-button>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">{{$parent.cancleLabel}}</md-button>
      <md-button class="md-primary" @click="onConfirm">{{$parent.applyLabel}}</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'sort-picker',
    props: ['identifier', 'active', 'config'],
    data() {
      return {
        isActive: false,
        selection:'',
        desc: true,
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetSelection);
      this.$parent.$on('newUrlQuery', this.updateFromUrl);
    },
    methods: {
      onConfirm() {
        let displayString;
        this.apiQuery = {};
        this.urlQuery = {};
        if(this.selection) {
          const selection = JSON.parse(this.selection);
          this.apiQuery[`$sort[${selection[0]}]`] = (this.desc)?(1):(-1);
          this.urlQuery['sort'] = selection[0];
          this.urlQuery['sortorder'] = (this.desc)?(1):(-1);
          displayString = this.config.displayTemplate.replace(/%1/g, selection[1]+((this.desc)?(' ▼'):(' ▲')));
          this.$emit('set', this.identifier, {
            apiQuery: this.apiQuery,
            urlQuery: this.urlQuery,
            displayString
          });
        }
      },
      onCancle() {
        this.$emit('cancle');
      },
      resetSelection(key) {
        if (key == this.identifier || !key) {
          this.selection = JSON.stringify(
                              this.config.options.filter(option => {
                                return option[0] == this.config.defaultSelection;
                              })[0]
                            ) || '';
          this.desc = (this.config.defaultOrder === "DESC");
        }
      },
      updateFromUrl(urlQuery){
        if(urlQuery.sort){
          this.selection = JSON.stringify(this.config.options.filter(option => {
            return (option[0] == urlQuery.sort);
          })[0]);
          this.desc = (urlQuery.sortorder == "1");
        }

        this.onConfirm();
      }
    },
    watch: {
      active(to, from) {
        this.isActive = to;
      },
      isActive(to) {
        if (to == false) {
          this.onCancle();
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  #selection-picker {
    padding: 16px;

    display: flex;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    align-items: center;
    > *{
      display: inline-block;
      vertical-align: middle;
    }
  }
</style>
