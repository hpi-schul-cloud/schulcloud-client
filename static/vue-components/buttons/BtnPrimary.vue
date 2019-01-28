<template>
  <button class="btn" @click="onClick">
    <span>
      <slot></slot>
    </span>
  </button>
</template>

<script>
  import '../styles/base.css';
  export default {
    name: 'BtnPrimary',
    data() {
      return {
      };
    },
    methods: {
      onClick() {
        this.$emit('click');
      },
    },
  };

</script>

<style scoped>
  .btn {
    padding: 0;

    overflow: hidden;

    border-width: 0;
    outline: none;
    border-radius: 2px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .6);

    background-color: #b10438;
    color: #fff;

    transition: background-color .3s;
  }

  .btn:hover, .btn:focus {
  background-color: #555555;
  cursor: pointer;
  }

  .btn > * {
  position: relative;
  }

  .btn span {
    display: block;
    padding: 10px 20px;
  }

</style>
