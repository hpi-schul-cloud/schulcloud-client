<template>
  <div>
    <md-button class='md-primary' @click="addToLesson()">
      <md-icon>add</md-icon>
    </md-button>
    <md-dialog-confirm
    :md-active.sync="addToCourseDialogActive"
    md-title="Inhalt zum Kurs hinzufügen"
    :md-content="dialogHTML"
    md-confirm-text="Hinzufügen"
    md-cancel-text="Abbrechen"
    @md-cancel="cancelAdd()"
    @md-confirm="confirmAdd()" />
  </div>
</template>

<script>
  export default {
    props: ['data', 'contentId'],
    name: 'AddToLesson',
    data() {
      return {
        addToCourseDialogActive: false,
        dialogHTML: `
          <div class="form-group">
              <label for="courseId">Kurs / Fach</label>
              <select class="course-selection form-control" name="courseId" required="required">
                  <option value="" selected hidden>Wähle...</option>
              </select>
          </div>

          <div class="form-group lessons" style="display: none">
              <label for="name">Unterrichtsthema</label>
              <select class="lesson-selection form-control" name="lessonId" required="required">
              </select>
          </div>
        `
      };
    },
    methods: {
      addToLesson() {
        let that = this;
        that.addToCourseDialogActive = true;

        $.getJSON('/content/' + this.contentId, function (result) {
          var courses = result.courses.data;
          var $selection = $('.course-selection');
          courses.forEach(function (course) {
            var option = document.createElement("option");
            option.text = course.name;
            option.value = course._id;
            $selection.append(option);
          });

          $('.course-selection').on('change', function () {
            var selectedCourse = $(this).find("option:selected").val();
            that.courseId = selectedCourse;
            $.getJSON('/courses/' + selectedCourse + '/json', function (res) {
              that.populateLessonSelection(res.lessons.data);
            });
          });
        });

      },
      populateLessonSelection(lessons) {
        var $selection = $('.lesson-selection');
        $selection
          .find('option')
          .remove()
          .end();

        if (lessons.length > 0) {
          this.lessonId = lessons[0]._id;
        };

        lessons.forEach(function (lesson) {
          var option = document.createElement("option");
          option.text = lesson.name;
          option.value = lesson._id;
          $selection.append(option);
        });

        $('.lessons').css("display", "block");

        var that = this;
        $('.lesson-selection').on('change', function () {
          var selectedLesson = $(this).find("option:selected").val();
          console.log("inside lesson-selection-change");
          that.lessonId = selectedLesson;
        });
      },
      confirmAdd() {
        console.log("confirm add");
        var dataToSend = {
          lessonId: this.lessonId,
          courseId: this.courseId,
          title: this.data.title,
          description: this.data.description,
          content: this.data.content,
        }
        this.$http
          .post(this.$config.API.baseUrl + this.$config.API.clientPort + '/content/addToLesson', dataToSend, { //TODO: ask if we can skip material; then send contentId as well
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            }
          })
          .then((response) => {
            console.log("trying to redirect");
            window.location.href = this.inReview ? "content/review?msg=Inhalt erfolgreich hinzugefügt." : "/content/search?msg=Inhalt erfolgreich hinzugefügt.";
          })
          .catch((e) => {
            console.error(e);
            alert("Fehler beim Hinzufügen. Entschuldigung! Bitte probieren Sie es später noch mal.")
          });
        return;
      },
      cancelAdd() {
        return;
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
</style>
