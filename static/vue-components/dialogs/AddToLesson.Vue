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
    @md-clicked-outside="cancelAdd()"
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

        let jwt
        try{
          jwt = document.cookie.split(';').find((cookie) => { return cookie.includes('jwt');}).split('=')[1];
        } catch (error) {
          console.error("not authenticated")
        }

        this.$http
          .get(this.$config.API.serverURL + "/courses?", {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }).then((response) => {
            const courses = response.body.data;

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
          client: this.data.providerName,
          url: this.data.url,
          description: this.data.description,
          content: this.data.content,
        }

        let jwt
        try{
          jwt = document.cookie.split(';').find((cookie) => { return cookie.includes('jwt');}).split('=')[1];
        } catch (error) {
          console.error("not authenticated")
        }

        this.$http
          .post(this.$config.API.clientURL + '/content/addToLesson', dataToSend, { //TODO: ask if we can skip material; then send contentId as well
            headers: {
              Authorization: `Bearer ${jwt}`,
            }
          })
          .then((response) => {
            console.log("trying to redirect");
            window.location.href = this.inReview ? "content/?msg=Inhalt erfolgreich hinzugefügt." : "/content/?msg=Inhalt erfolgreich hinzugefügt.";
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
