<template>
  <div class="card-border">
    <div class="card-info">
      <p>{{course.name}}</p>
    </div>
    <div class="card-main-content" :style="background_style"></div>
    <div>{{course.schoolId}}</div>
    <CardFooter :course="course"></CardFooter>
  </div>
</template>

<script>
import CardFooter from '../components/CardFooter.vue'

export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    course: {
      type: Object,
      default: {
        color: '#555',
        name: 'default name'
      }
    }
  },
  computed: {
    background_style () {
      return 'background: ' + this.course.color
    }
  }, 
  components: {
    CardFooter
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card-border {
  flex: 0 0 350px;
/*   flex-basis: 350px; */
  position: relative;
  height: 200px;
  border-radius: 3px;
  box-shadow: 2px 2px 5px gray;
  margin: 15px 5px;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}
.card-main-content {
  width: 100%;
}
.card-info {

}
.card-info p {
  font-family: 'Asul', sans-serif;
  margin: 0;
}
.card-border:hover {
  box-shadow:  0px 4px 14px rgb(126, 124, 124);
}
</style>
