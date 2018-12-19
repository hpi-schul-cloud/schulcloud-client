<template>
  <div class="card-main-content" v-bind:style="background_style">
    {{course.name}}
    <br>
    <div v-for="(time,i) of times_computed" :key="i">{{time.weekday}} at {{time.startTime}}</div>
  </div>
</template>

<script>
export default {
  props: {
    course: {
      type: Object
    }
  },
  computed: {
    background_style() {
      return "background-color: " + this.course.color;
    },
    times_computed() {
      let weekdays = [
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
        "Sonntag"
      ];
      return this.course.times.map(time => {
        time.weekday = weekdays[time.weekday];
        let startTime =
          time.startTime / 1000 / 60 / 60 +
          ":" +
          ((time.startTime / 1000 / 60 / 60) % 60);
        time.startTime = startTime;
        return time;
      });
    }
  }
};
</script>


<style scoped>
.card-main-content {
  font-family: "Asul", sans-serif;
  color: aliceblue;
}
</style>