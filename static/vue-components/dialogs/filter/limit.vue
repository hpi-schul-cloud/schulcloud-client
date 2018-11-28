<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>{{config.title}}</md-dialog-title>

    <div id="limit-picker" class="md-menu-content-container md-scrollbar md-theme-default">
      <md-radio v-model="selection" v-for="option in config.options"
                :key="option"
                :value="option"
                class="md-primary">
        {{option}}
      </md-radio>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">{{$parent.cancleLabel}}</md-button>
      <md-button class="md-primary" @click="onConfirm">{{$parent.applyLabel}}</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'limit-picker',
    props: ['identifier', 'active', 'config'],
    data() {
      return {
        isActive: false,
        selection: 0,
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
        if (this.selection) {
          this.apiQuery['$limit'] = this.selection;
          this.urlQuery['$limit'] = this.selection;
          displayString = this.config.displayTemplate.replace(/%1/g, this.selection);
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
          this.selection = this.config.defaultSelection || 0;
        }
      },
      updateFromUrl(urlQuery){
        if(urlQuery['$limit']){
          this.selection = urlQuery['$limit'];
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
  #limit-picker{
    max-height: 200px;
    max-height: 40vh;
    padding: 16px;
    .md-checkbox, .md-radio{
      display: flex;
    }
  }
</style>
