<template>
  <div class="">
    <div id="togglePreview" v-show="editable">
      <md-switch v-model="editorView">
        <span v-if='editorView'>Bearbeiten</span>
        <span v-else='editorView'>Vorschau</span>
      </md-switch>
    </div>

    <div class="editor-wrapper" v-show="editorView">
      <textarea id="editor">
      </textarea>
      <!-- <button type="button" @click='print' name="button">Print me</button> -->
    </div>

    <teacher-content v-show="!editorView" class="teacher-content" :teacherContent="data" />

  </div>
</template>

<script>
  import teacherContent from  './TeacherContent.vue';

  export default {
    components: {
      'teacher-content': teacherContent
    },
    name: 'EditContent',
    data() {
      return {
        editor: {},
        title: "",
        description: "",
        editorView: false,
        editable: false,
        contentId: window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1),
        data: {
          title: '',
          description: '',
          content: ''
        }
      };
    },
    props: ['userId', 'teacherContent'],
    created() {
      if (this.contentId) {
        this.loadContent();
      } else {
        this.editable = true;
        this.editorView = true;
      }
    },
    methods: {
      loadContent() {
        this.$http
          .get(this.$config.API.baseUrl + this.$config.API.port + '/content/resources/' + this.contentId, {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiI1YjM3Y2NmNWRhNWU4NDI3Y2Y3ZTAwOWQiLCJ1c2VySWQiOiI1YjM3Y2MxNmRhNWU4NDI3Y2Y3ZTAwOWMiLCJpYXQiOjE1MzIwMDE2MDUsImV4cCI6MTUzNDU5MzYwNSwiYXVkIjoiaHR0cHM6Ly9zY2h1bC1jbG91ZC5vcmciLCJpc3MiOiJmZWF0aGVycyIsInN1YiI6ImFub255bW91cyIsImp0aSI6IjlhY2JhYzJiLTY2MGMtNDU0YS05ODJiLTE1MDNiMDMxNTNjMyJ9.XgP2sFf30mNdyAyrhib57irYoBeVEz3fex1xg7B8sT0`, //${localStorage.getItem('jwt')}
            },
          })
          .then((response) => {
            console.log(response);
            this.data = response.body;
          })
          .catch((e) => {
            this.error = true;
            console.error(e);
          });
      },
      print() {
        this.editor.focus();
        var e = new Event("keyup");
        e.key="p";    // just enter the char you want to send
        e.keyCode=e.key.charCodeAt(0);
        e.which=e.keyCode;
        e.altKey=false;
        e.ctrlKey=true;
        e.shiftKey=false;
        e.metaKey=true;
        e.bubbles=true;
        document.dispatchEvent(e);

        e = new Event("keypress");
        e.key="p";    // just enter the char you want to send
        e.keyCode=e.key.charCodeAt(0);
        e.which=e.keyCode;
        e.altKey=false;
        e.ctrlKey=true;
        e.shiftKey=false;
        e.metaKey=true;
        e.bubbles=true;
        document.dispatchEvent(e);

        e = new Event("keydown");
        e.key="p";    // just enter the char you want to send
        e.keyCode=e.key.charCodeAt(0);
        e.which=e.keyCode;
        e.altKey=false;
        e.ctrlKey=true;
        e.shiftKey=false;
        e.metaKey=true;
        e.bubbles=true;
        document.dispatchEvent(e);
      }
    },
    mounted() {
      this.editor = CKEDITOR.replace( 'editor', {
          toolbar: [
            { name: 'clipboard', items: [ 'Undo', 'Redo' ] },
            { name: 'styles', items: [ 'Format' ] },
            { name: 'basicstyles', items: [ 'Bold', 'Italic' ] },
            { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote' ] },
            { name: 'links', items: [ 'Link', 'Unlink' ] },
            { name: 'insert', items: [ 'Image', 'EmbedSemantic', 'Table' ] },
          ],
          customConfig: '',
          defaultLanguage: 'de',
          extraPlugins: 'uploadimage,autoembed,image2,uploadfile',
          filebrowserUploadUrl: '/files/uploadToShare',
          removePlugins: 'image',
          height: 1000,
          width: 800,
          contentsCss: [ 'https://cdn.ckeditor.com/4.8.0/standard-all/contents.css', 'mystyles.css' ],
          bodyClass: 'article-editor',
          removeDialogTabs: 'image:advanced;link:advanced',
          stylesSet: [
            { name: 'Marker',			element: 'span', attributes: { 'class': 'marker' } },
            { name: 'Cited Work',		element: 'cite' },
            { name: 'Inline Quotation',	element: 'q' },
            {
              name: 'Special Container',
              element: 'div',
              styles: {
                padding: '5px 10px',
                background: '#eee',
                border: '1px solid #ccc'
              }
            },
            {
              name: 'Compact table',
              element: 'table',
              attributes: {
                cellpadding: '5',
                cellspacing: '0',
                border: '1',
                bordercolor: '#ccc'
              },
              styles: {
                'border-collapse': 'collapse'
              }
            },
            { name: 'Borderless Table',		element: 'table',	styles: { 'border-style': 'hidden', 'background-color': '#E6E6FA' } },
            { name: 'Square Bulleted List',	element: 'ul',		styles: { 'list-style-type': 'square' } },
            { name: 'Illustration', type: 'widget', widget: 'image', attributes: { 'class': 'image-illustration' } },
            { name: '240p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-240p' } },
            { name: '360p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-360p' } },
            { name: '480p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-480p' } },
            { name: '720p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-720p' } },
            { name: '1080p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-1080p' } }
          ]
      } );

      var that = this;
      this.editor.on( 'change', function( evt ) {
          that.$emit('editor-update', evt.editor.getData());
          that.data.content = evt.editor.getData();
          that.editor.setData(that.data.content);
          if (that.data.userId === that.userId) {
            that.editor.setReadOnly();
          } else {
            that.editor.setReadOnly(false);
          }
      });
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  .editor-wrapper {
    margin: 0 auto;
    width: 800px;
  }

  #cke_1_bottom {
    display: none;
  }

  #cke_2_bottom {
    display: none;
  }
  
  @media print {
    // no ugly comments when printing the page
    @page { margin: 0; size: auto }

    aside, nav, section.section-title, h1, h2, h3, h4, h5, h6, input, textarea, .md-steppers-navigation, .md-field, .md-ripple, #cke_1_top {
      display: none !important;
    }

    * {
      margin: 0 !important;
      padding: 0 !important;
    }

    .stepper-card {
      margin: 0 !important;
      border: 0 !important;
    }

    .md-card {
      box-shadow: 0 !important;
    }

    .cke_chrome {
      border: 0 !important;
    }

    #cke_editor {
      padding: 1.6cm;
    }

  }


</style>
