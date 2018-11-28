<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>{{config.title}}</md-dialog-title>

    <div id="selection-picker">
      <div class="choice" v-for="(label, property) in config.options">
        {{label}}
        <div class="tri-state-toggle">
          <input type="radio" v-model="selections[property]" :value="false">
          <input type="radio" v-model="selections[property]" :value="undefined">
          <input type="radio" v-model="selections[property]" :value="true">
        </div>
      </div>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">{{$parent.cancleLabel}}</md-button>
      <md-button class="md-primary" @click="onConfirm">{{$parent.applyLabel}}</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'boolean-picker',
    props: ['identifier', 'active', 'config'],
    data() {
      return {
        isActive: false,
        selections:{},
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
        if(Object.keys(this.selections).length) {
          for (var property in this.selections) {
            if (this.selections[property] !== undefined) {
              if (this.config.applyNegated[property]) {
                const negate = this.config.applyNegated[property][(this.selections[property]) ? 1 : 0];
                const configuredProperty = ((negate) ? (property + '[$ne]') : property)
                const configuredSelection = ((negate) ? (!this.selections[property]) : (this.selections[property]))
                this.apiQuery[configuredProperty] = configuredSelection;
              } else {
                this.apiQuery[property] = this.selections[property];
              }


              this.urlQuery[property] = this.selections[property];
              displayString = ((displayString) ? (displayString + ", ") : "") + `${this.config.options[property]}: ${(this.selections[property]) ? '✔' : '✖'}`;
            }
          }
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
          this.selections = this.config.defaultSelection || {};
        }
      },
      updateFromUrl(urlQuery){
        for (var property in this.config.options) {
          if(urlQuery[property]){
            this.selections[property] = (urlQuery[property] == "true");
          }
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
  }
  .choice{
    display: flex;
    justify-content: space-between;
    font-size: 1em;
    line-height: 2.3rem;
    padding: .5rem 0;
    &:not(:last-of-type){
      border-bottom: 1px dashed lightgrey;
    }
  }
  .tri-state-toggle{
    *{
      box-sizing: border-box;
    }
    display: inline-block;
    font-size: 0;
    line-height: 0;
    white-space: nowrap;
    margin-left: 25px;
    input{
      display: inline-block;
      height: 32px;
      width: 32px;
      visibility: hidden;
      margin: 0;
      padding: 0;
      &:before{
        visibility: visible;
        display: block;
        box-sizing: border-box;
        height: 32px;
        width: 32px;
        padding: 8px 0;
        font-size: 16px;
        line-height: 16px;
        text-align: center;
        color: #fff;
        background-color: rgba(0,0,0,.3);
        transition: background-color .3s ease-in-out;
      }
      &:nth-of-type(1):before{
        content: '✖';
        border-radius: 50% 0 0 50%;
      }
      &:nth-of-type(2):before{
        content: '◯';
      }
      &:nth-of-type(3):before{
        content: '✔';
        border-radius: 0 50% 50% 0;
      }
      &:nth-of-type(1):checked:before{
        background-color: #B10438;
        border-radius: 50% 0 0 50%;
      }
      &:nth-of-type(2):checked:before{
        background-color: grey;
      }
      &:nth-of-type(3):checked:before{
        background-color: #2E7D32;
        border-radius: 0 50% 50% 0;
      }
    }
  }
</style>
