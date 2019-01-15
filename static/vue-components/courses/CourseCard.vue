
<template>
  <div class="course-card">
    <!-- <CourseCardHeader v-bind:course="course"></CourseCardHeader> -->
    <div class="tab">
      <div class = "tab-label">MusterLehrerin</div>
    </div>
    <div class="card-info" v-bind:style="background_style">
      <h1 class="mt-0 mb-0"> {{course.abbreviation}}</h1>
      <h3 class="mt-0 mb-0"> {{course.name}}</h3>
    </div>
      <CardFooter :course="course"></CardFooter>
  </div>
</template>

<script>
import CardFooter from "./CardFooter.vue";
// import CourseCardHeader from "./CourseCardHeader.vue";

export default {
  name: "CourseCard",
  props: {
    msg: String,
    course: {
      type: Object,
      default: {
        color: "#E42C85",
        name: "default name",
        times: [{ weekday: 1, startTime: 36000000 }]
      }
    }
  },
  computed: {
    background_style() {
      return "background: " + this.course.color;
    }
  },
  components: {
    CardFooter,
    // CourseCardHeader
  }
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mt-0 {
  margin-top: 0 !important;
}
.mb-0 {
  margin-bottom: 0 !important;
}
h1 {
  font-size: 60px;
  font-weight: bold;
  font-family: PT Sans Caption;
}
h3 {
  font-size: 20px;
  font-weight: bold;
  font-family: PT Sans Narrow;
}
.course-card {
  width: 260px;
  border-radius: 3px;
  box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 4px 0 rgba(0,0,0,0.20);
  padding: 10px;
  cursor: pointer;
}
.card-info {
  margin-top: -5px;
  border-radius: 4px;
  padding: 10px;
  color: white
  /* background-image: linear-gradient(-225deg, #E42C85 0%, #3B1E65 100%); */
}
.card-info p {
  font-family: "Asul", sans-serif;
  margin: 0;
}
.card-border:hover {
  box-shadow: 0px 4px 14px rgb(126, 124, 124);
}
.tab-label {
padding: 7.5px 10px;
transform: skewX(0deg);
transform-origin: bottom left;
width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
.tab {
  height: 34px;
  position: relative;
  z-index: -1;
  overflow: hidden;
  border-radius: 5px;
  border-bottom-left-radius: 0px;
}

.tab:before {
  background-color: #dedede;
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 125px;
  border-top-right-radius: 5px;
  transform: skewX(25deg);
  transform-origin: bottom left;
}


</style>
