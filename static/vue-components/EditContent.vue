<template>
  <div class="">
    <div id="togglePreview" v-show="editable">
      <md-switch v-model="editorView">
        <span v-if='editorView'>Bearbeiten</span>
        <span v-else='editorView'>Vorschau</span>
      </md-switch>
    </div>

    <div v-show="editorView">
      <textarea id="editor">
      </textarea>
      <button type="button" @click='print' name="button">Print me</button>
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
            this.editor.setData(this.data.content);
            if (this.data.userId === this.userId) {
              this.editable = true;
            } else {
              this.editable = false
            }
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
          // Enabling extra plugins, available in the standard-all preset: http://ckeditor.com/presets-all
          extraPlugins: 'uploadimage,autoembed,image2,uploadfile',
          /*********************** File management support ***********************/
          // See http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_ckfinder_integration
          // filebrowserBrowseUrl: 'http://example.com/ckfinder/ckfinder.html',
          filebrowserUploadUrl: '/files/uploadToShare',
          // Remove the default image plugin because image2, which offers captions for images, was enabled above.
          removePlugins: 'image',
          // Make the editing area as big as A4 print.
          height: 1000,
          width: 800,
          // An array of stylesheets to style the WYSIWYG area.
          // Note: it is recommended to keep your own styles in a separate file in order to make future updates painless.
          contentsCss: [ 'https://cdn.ckeditor.com/4.8.0/standard-all/contents.css', 'mystyles.css' ],
          // This is optional, but will let us define multiple different styles for multiple editors using the same CSS file.
          bodyClass: 'article-editor',
          // Reduce the list of block elements listed in the Format dropdown to the most commonly used.
          // format_tags: 'p;h1;h2;h3;pre', TODO: Comment in again if needed?
          // Simplify the Image and Link dialog windows. The "Advanced" tab is not needed in most cases.
          removeDialogTabs: 'image:advanced;link:advanced',
          // Define the list of styles which should be available in the Styles dropdown list.
          // If the "class" attribute is used to style an element, make sure to define the style for the class in "mystyles.css"
          // (and on your website so that it rendered in the same way).
          // Note: by default CKEditor looks for styles.js file. Defining stylesSet inline (as below) stops CKEditor from loading
          // that file, which means one HTTP request less (and a faster startup).
          // For more information see http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_styles
          stylesSet: [
            /* Inline Styles */
            { name: 'Marker',			element: 'span', attributes: { 'class': 'marker' } },
            { name: 'Cited Work',		element: 'cite' },
            { name: 'Inline Quotation',	element: 'q' },
            /* Object Styles */
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
            /* Widget Styles */
            // We use this one to style the brownie picture.
            { name: 'Illustration', type: 'widget', widget: 'image', attributes: { 'class': 'image-illustration' } },
            // Media embed
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
      });
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

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
