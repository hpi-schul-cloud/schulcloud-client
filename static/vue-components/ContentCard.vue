<template>
  <article class="content-card">
    <md-card class="card-content height-100">
      <md-card-media md-ratio="16:9">
        <img :src="(data.thumbnail||'https://placeholdit.co//i/320x180?bg=CCC&fc=000&text=Platzhalter')"
             :alt="'Thumbnail for ~' + data.title + '~'">
      </md-card-media>

      <md-card-header>

        <h2 class="md-title">{{data.title||"Titel"}}</h2>
        <span v-if="averageStars && averageStars[0]" class="content-information">&#216; {{averageStars[0].average}} &#9734; <i v-if="data.approved">&#2611;</i> </span>

        <div class="md-subhead">
          <div v-if="topicAndTags.length > 0" class="tags">
            <md-icon>label</md-icon>
            <span v-for="tag in (topicAndTags).slice(0,this.$config.card.displayedTags)">
                {{ tag }},
              </span>
          </div>
        </div>
        <div class="card-categories">
          <md-chip class="subjects" v-for="subject in (data.subjects || [])" :key="subject">
            {{ subject }}
          </md-chip>
          <md-chip v-if="data.goal" class="goal">
            {{ data.goal }}
          </md-chip>
          <md-chip v-if="data.difficulty" class="difficulty">
            {{ data.difficulty }}
          </md-chip>
          <md-chip v-if="data.age" class="age-range">
            {{ `${data.age} +- ${data.ageRange}` }}
          </md-chip>
        </div>
      </md-card-header>

      <md-card-content>
        {{ (data.description||"Beschreibung...").substring(0, 300) }}{{ ((data.description||"").length>300)?'...':'' }}
      </md-card-content>

      <md-card-actions>
        <div class="providerName">
          via {{data.providerName}}
        </div>
        <md-button  class="md-primary" @click="open()">
          <md-icon>{{ openIconName }}</md-icon>
        </md-button>
        <md-button v-if="!inReview" class='md-primary' @click="addToLesson()"> <!-- @click="dialog.active = true" -->
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
      </md-card-actions>
      <!-- md-content="<div class='form-group'><label for='courseId'>Wählen Sie einen Kurs / Fach</label>  <select class='course-selection form-control' name='courseId' required='required'><option value='' selected hidden>Wähle...</option></select></div><div class='form-group lessons' style='display: none'><label for='name'>Wählen Sie ein Unterrichtsthema</label><select class='lesson-selection form-control' name='lessonId' required='required'></select></div>" -->
      <!-- md-content="TODO!<br><br>Hier brauchen wir <strong>wein Dropdown</strong> mit den Kursen, die wir gerade geholt haben. Oder, falls die leer sind, entsprechend einen Hinweis + Link.<br><br>Wie wäre es außerdem mit der Möglichkeit, eine Kopie bei sich zu speichern?" -->
    </md-card>
    <confirmDialog v-bind:config="dialog" @confirm="onConfirm"/>
  </article>
</template>

<script>
  import confirmDialog from './dialogs/confirm.vue';

  export default {
    components: {
      confirmDialog,
    },
    props: ['data', 'contentId', 'inReview', 'ownContent'],
    name: 'ContentCard',
    data() {
      return {
        addToCourseDialogActive: false,
        lessonId: undefined,
        courseId: undefined,
        dialog: {
          active: false,
          title: 'Schul-Cloud verlassen?',
          content: 'Möchten Sie die Schul-Cloud wirklich verlassen und externen Inhalt öffnen?',
          confirm: 'Ja, verlassen',
          cancle: 'Nein',
        },
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
    computed: {
      openIconName: function () {
        if (this.data.providerName !== 'Schul-Cloud') {
          return 'open_in_new';
        }
        if (this.ownContent) {
          return 'edit';
        }
        return 'remove_red_eye';
      },
      topicAndTags: function () {
        return (this.data.tags || []).concat(this.data.topics);
      },
      averageStars: function() {
        if (!this.data.ratings) {
          return undefined;
        }

        var avg = Array.from(this.data.ratings.reduce(
            (acc, obj) => Object.keys(obj).reduce(
                (acc, key) => typeof obj[key] == "number"
                    ? acc.set(key, (acc.get(key) || []).concat(obj[key]))
                    : acc,
            acc),
        new Map()),
            ([name, values]) =>
                ({ name, average: values.reduce( (a,b) => a+b ) / values.length })
        );

        return Math.round(avg*100)/100;
      }
    },

    methods: {
      open() {
        if (this.data.providerName === "Schul-Cloud" ) {
          console.log('/content/review/' + this.contentId);
          location.href = '/content/review/' + this.contentId;
        } else {
          dialog.active = true;
        }
      },
      onConfirm() {
        window.open(this.$config.API.baseUrl + this.$config.API.redirectPath + this.contentId, '_blank');
      },
      addToLesson() {
        let that = this;
        that.addToCourseDialogActive = true;

        $.getJSON('/content/' + this.contentId, function (result) {
  			  var fields = result.content;
          var courses = result.courses.data;
          // var courses = [{name: "Englisch 10A", _id: 1}, {name: "Test ABC", _id: 1}];
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

        // lessons = [{name: "test123", _id: 42}, {name: "2test321", _id: 4242}]; // TODO: Remove and keep responst from server
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
            console.log(window);
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
  .card-content {
    width: 100%;
    position: relative;
    padding-bottom: 52px;
    height: 100%;
    word-break: break-all;
    word-break: break-word;
    overflow: hidden;
    .md-subhead {
      .md-icon {
        $size: 16px;

        width: $size;
        min-width: $size;
        height: $size;
        min-height: $size;
        font-size: $size;
        line-height: $size;
      }

      span {
        vertical-align: middle;
      }
    }
    .md-card-actions {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      .providerName {
        position: absolute;
        left: 16px;
      }
    }
    .md-card-actions .md-button {
      min-width: 0;
    }

    .content-information {
      display: block;
      font-size: 1.2em;
      color: #a80731;
      float: right;
      margin: 5px;
    }

    .md-chip {
      font-size: 12px;
      line-height: 20px;
      height: 20px;
      padding: 0 10px;
      border-radius: 20px;
      margin-top: 5px;
      margin-left: 0;
      margin-right: 5px;
    }

    .card-categories .md-chip.md-theme-default.subjects {
      background-color: #A80631;
      color: white;
    }

    .card-categories .md-chip.md-theme-default.age-range {
      background-color: #E6C229;
      color: #434857;
    }

    .card-categories .md-chip.md-theme-default.goal {
      background-color: #F17105;
      color: white;
    }

    .card-categories .md-chip.md-theme-default.difficulty {
      background-color: #F8A41B;
      color: #434857;
    }
  }
</style>
