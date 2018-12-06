<template>
  <article class="content-card">
    <md-card class="card-content height-100">
      <md-card-media md-ratio="16:9" @click="open()" class="thumbnail-image">
        <img :src="(data.thumbnail||'https://placeholdit.co//i/320x180?bg=CCC&fc=000&text=Platzhalter')"
             :alt="'Thumbnail for ~' + data.title + '~'"
             @click="open()">
      </md-card-media>

      <md-card-header class="content-card-header">
        <img v-if="data.approved" class="approved-icon" src='/images/content/approved.svg' alt="Approved" width="50" height="25">
        <img v-if="data.providerName === 'Schul-Cloud'" class="community-icon" src='/images/content/Lehrerzimmer.png' alt="Aus dem Lehrerzimmer" width="50" height="25">

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

      <md-card-actions class="content-card-footer">
        <div class="content-card-footer-text">
          <div>
            via {{data.providerName}}
          </div>

          <!-- License -->
          <div v-if="data.licenses" class="licenses">
            <a @click="showDialog = true">Lizenzbestimmungen</a>
          </div>
          <div v-else class="licenses">
            Keine Lizenzbestimmungen (freie Nutzung erlaubt)
          </div>
          <md-dialog :md-active.sync="showDialog">
            <md-dialog-title>Lizenzbestimmungen</md-dialog-title>
            <md-dialog-content>
              Es gelten folgende Lizenzbestimmungen:
              <ul>
                <li v-for='license in data.licenses'>{{license}}</li>
              </ul>
            </md-dialog-content>
            <md-dialog-actions>
              <md-button class="md-primary" @click="showDialog = false">Schließen</md-button>
            </md-dialog-actions>
          </md-dialog>

        </div>
        <md-button class="md-primary" @click="open()">
          <md-icon>{{ openIconName }}</md-icon>
        </md-button>
        <add-to-lesson :data="data" :contentId="contentId" v-if="!inReview" />
      </md-card-actions>
      <confirmDialog v-bind:config="dialog" @confirm="onConfirm" @cancle="onCancle"/>
    </md-card>
  </article>
</template>

<script>
  import AddToLesson from './dialogs/AddToLesson.vue';
  import confirmDialog from './dialogs/confirm.vue';
  // import approvedImg from './approved.svg';

  export default {
    components: {
      confirmDialog,
      'add-to-lesson': AddToLesson
    },
    props: ['data', 'contentId', 'inReview', 'ownContent'],
    name: 'ContentCard',
    data() {
      return {
        // approvedImg,
        addToCourseDialogActive: false,
        showDialog: false,
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
        if (this.data.providerName !== 'Schul-Cloud' && !this.inReview) {
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
        this.dialog.active = true;
      },
      onConfirm() {
        this.dialog.active = false;
        window.open(this.$config.API.clientURL + this.$config.API.redirectPath + this.contentId, '_blank');
      },
      onCancle() {
        this.dialog.active = false;
      },
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
      .content-card-footer-text {
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

    .content-card-header {
      position: relative;
    }

    .approved-icon {
      position: absolute;
      transform: rotate(30deg);
      width: 100px;
      top: -25px;
      right: -30px;
    }

    .community-icon {
      position: absolute;
      position: absolute;
      transform: rotate(-10deg);
      width: 150px;
      top: -20px;
      border-radius: 0;
    }

    .content-card-footer {
      background-color: #F4F3F4;
      border-top: 1px solid #DFDFDF;
    }

    .licenses a {
      cursor: pointer;
    }

    .thumbnail-image {
      cursor: pointer;
    }

  }
</style>
