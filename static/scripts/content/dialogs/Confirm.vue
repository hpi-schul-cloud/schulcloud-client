<template>
  <md-dialog-confirm
    :md-active.sync="isActive"
    :md-title="config.title || 'Agree/Disagree?'"
    :md-content="config.content"
    :md-confirm-text="config.confirm || 'Agree'"
    :md-cancel-text="config.cancle || 'Disagree'"
    @md-cancel="onCancel"
    @md-confirm="onConfirm"/>
</template>

<script>
  export default {
    name: 'DialogConfirm',
    props: ['config'],
    data() {
      return {
        isActive: false,
      };
    },
    methods: {
      onConfirm() {
        this.$emit('confirm');
        if (this.config.onConfirm) {
          this.config.onConfirm();
        }
      },
      onCancel() {
        this.$emit('cancle');
        if (this.config.onCancle) {
          this.config.onCancle();
        }
      },
    },
    watch: {
      'config.active': function (to, from) {
        console.log('changed active', to);
        this.isActive = to;
      },
    },
  };
</script>
