<template>
  <div class="card-footer">
    <font-awesome-icon :icon="['far', 'clock']" size="lg"/>
    {{times_computed[1]}} {{times_computed[1].startTime}} | R-{{times_computed[1].room}}

  </div>
</template>

<script>
export default {
  name: 'CardFooter',
  props: {
    course: {
      type: Object
    }
  },
  components: {
  },
  computed: {
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
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card-footer {
  height: 24px;
  text-align: left;
  padding-top: 5px;
  margin-bottom: -5px;
  font-size: 16px;
  font-family: PT Sans Narrow;
}
</style>
