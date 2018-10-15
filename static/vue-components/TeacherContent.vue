<template>
  <div class="">
    <md-card class="teacherContent-content">
      <md-card-header>
        <div class="md-title">{{teacherContent.title}}</div>
        <div class="md-subhead">{{teacherContent.description}}</div>
      </md-card-header>
      <md-card-content>
        <div v-if="external">
          Externen Inhalt bitte in anderem Fenster anschauen.
        </div>
        <textarea v-else id="view-editor"></textarea>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>

  export default {
    components: {
    },
    props: ['teacherContent', 'external'],
    name: 'TeacherContent',
    data() {
      return {
        editor: {}
      }
    },
    watch: {
      teacherContent: function (val) {
        this.editor.setData(val.content);
      }
    },
    mounted() {
      this.editor = CKEDITOR.replace( 'view-editor', {
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
      });

      setTimeout(() => {
        this.editor.setReadOnly();
      },1000)
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  @import "./default";

  #cke_1_top {
      display: none;
  }

  #cke_1_bottom {
    display: none;
  }

  .teacherContent-content {
    min-width: 500px;
    max-width: 850px;
    margin: 0 auto;
  }

  @media only screen and (max-width: 600px) {
    .teacherContent-content {
        width: 100%;
    }
  }

</style>
