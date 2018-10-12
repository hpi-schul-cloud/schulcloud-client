<template>
  <md-dialog :md-active.sync="isActive">
    <div id="rating-review">
        <template v-if="proposal">
            <md-dialog-title>{{ $lang.rating[role].modal_title}}</md-dialog-title>
        </template>
        <template v-else>
            <md-dialog-title>{{ $lang.rating.modal_title}}</md-dialog-title>
            <md-field>
                <span class="label">Text</span>
                <span class="stars">
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                </span>
            </md-field>
            <md-field>
                <span class="label">Layout</span>
                <span class="stars">
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                </span>
            </md-field>
            <md-field>
                <span class="label">Insgesamt</span>
                <span class="stars">
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                    <md-icon>star_border</md-icon>
                </span>
            </md-field>
        </template>
        <md-field>
            <label for="ratingReview">{{ $lang.rating[role].placeholder}}</label>
            <md-textarea v-model="ratingReview">
            </md-textarea>
        </md-field>

        <md-dialog-actions>
          Denkst du, dass andere Lehrer*Innen diesen Inhalt nützlich finden würden?
            <md-button @click="onCancle">Nein, bitte überarbeiten</md-button>
            <md-button class="md-primary" @click="onConfirm">Ja, Inhalt freischalten</md-button>
        </md-dialog-actions>
    </div>
  </md-dialog>
</template>

<script>
  export default {
    name: 'DialogRateReview',
    props: ['identifier', 'active', 'role', 'proposal'],
    data() {
      return {
        isActive: false,
        ratingReview: '', // []
        todo: 'todo',
        apiQuery: {},
        urlQuery: {},
      };
    },
    created() {
      this.$parent.$on('reset', this.resetRatingReview);
    },
    methods: {
      onConfirm() {
        let displayString;

        // if (this.ratingReview.length != 0) {
        //   // TODO: Send request/event that content got accepted TODO: pass which content (contentID?)
        // } else {
        //   // TODO: Nothing?
        // }
        this.$emit('accept', this.identifier, {
          ratingReview: this.ratingReview
        });
      },
      onCancle() {
        this.$emit('cancle');
      },
      resetRatingReview(key) {
        if (key == this.identifier) {
          this.ratingReview = '';
        }
      },
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

<style lang="scss">
    #rating-review {
      padding: 16px;
    }

    .stars {
        color: orange;
    }

    .label {
        display: inline-block;
        width: 30%;
    }
</style>
