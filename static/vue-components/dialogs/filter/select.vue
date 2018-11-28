<template>
  <md-dialog :md-active.sync="isActive">
    <md-dialog-title>{{config.title}}</md-dialog-title>

    <div id="selection-picker">
      <div v-if="config.expanded" class="expanded-view md-menu-content-container md-scrollbar md-theme-default">
        <div v-if="config.multiple">
          <md-checkbox v-model="selections" v-for="option in config.options"
                    :key="option[0]"
                    :value="JSON.stringify(option)"
                     class="md-primary">
            {{option[1]}}
          </md-checkbox>
        </div>
        <div v-else>
          <md-radio v-model="selections" v-for="option in config.options"
                    :key="option[0]"
                    :value="JSON.stringify(option)"
                    class="md-primary">
            {{option[1]}}
          </md-radio>
        </div>
      </div>
      <md-field v-else>
        <label for="options">{{config.title}}</label>
        <md-select v-model="selections" id="options" :multiple="config.multiple">
          <md-option v-for="option in config.options"
                     :key="option[0]"
                     :value="JSON.stringify(option)">
            {{option[1]}}
          </md-option>
        </md-select>
      </md-field>
    </div>

    <md-dialog-actions>
      <md-button @click="onCancle">{{$parent.cancleLabel}}</md-button>
      <md-button class="md-primary" @click="onConfirm">{{$parent.applyLabel}}</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  export default {
    name: 'select-picker',
    props: ['identifier', 'active', 'config'],
    data() {
      return {
        isActive: false,
        selections: (this.config.multiple)?[]:'',
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetSelection);
      this.$parent.$on('newUrlQuery', this.updateFromUrl);
      if(this.config.defaultSelection){
        if(!Array.isArray(this.config.defaultSelection)){
          this.config.defaultSelection = [this.config.defaultSelection]
        }
      }else{
        this.config.defaultSelection = [];
      }
    },
    methods: {
      onConfirm() {
        let displayString;
        if (this.selections) {
          if(this.config.multiple){
            if(this.selections.length == 0){return;}
            const selections = this.selections.map(selection => {return JSON.parse(selection)});
            const selectedValues = selections.map(s => {return s[0];});
            const selectedLabels = selections.map(s => {return s[1];});
            this.apiQuery[this.config.property + '[$in]'] = selectedValues
            this.urlQuery[this.config.property] = selectedValues.reduce((prev, curr) => prev +','+ curr, '').slice(1);
            displayString = this.config.displayTemplate.replace(/%1/g, selectedLabels.reduce((prev, curr) => prev +', '+ curr, '').slice(1));
          }else{
            const selections = JSON.parse(this.selections);

            this.apiQuery[this.config.property] = selections[0];
            this.urlQuery[this.config.property] = selections[0];
            displayString = this.config.displayTemplate.replace(/%1/g, selections[1]);
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
          const defaultSelection = this.config.defaultSelection.map(selection => {
            selection = JSON.stringify(
              this.config.options.filter(option => {
                return option[0] == selection;
              })[0]
            );
            if(!selection){throw `default value '${selection}' is not in config list`;}
            return selection;
          }) || [];
          this.selections = (this.config.multiple)?(defaultSelection):(defaultSelection[0] || '');
        }
      },
      updateFromUrl(urlQuery){
        if(urlQuery[this.config.property]){
          const selections = urlQuery[this.config.property].split(",");
          let newSelections = selections.map(selection => {
            return JSON.stringify(this.config.options.filter(option => {
              return (option[0] == selection);
            })[0]);
          });
          if(!this.config.multiple) {
            newSelections = newSelections[0];
          }
          this.selections = newSelections;
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
  .expanded-view{
    max-height: 200px;
    max-height: 40vh;
    padding: 16px;
    margin: -16px;
    .md-checkbox, .md-radio{
      display: flex;
    }
  }
</style>
