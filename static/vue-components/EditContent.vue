<template>
  <div class="">
    <md-field>
      <label>Titel</label>
      <md-input v-model="title"></md-input>
    </md-field>
    <md-field>
      <label>Beschreibung</label>
      <md-textarea v-model="description"></md-textarea>
    </md-field>
    <textarea id="editor">
  		&lt;h2&gt;Essential things to think about before starting a blog&lt;/h2&gt;
  		&lt;figure class="image illustration" style="float:right;"&gt;&lt;img alt="A picture of wooden spoons with spices and herbs in them." src="https://chat.schul-cloud.org/avatar/jan?_dc=undefined" width="450px"/&gt;
  			&lt;figcaption&gt;It takes several ingredients to create a delicious blog.&lt;/figcaption&gt;
  		&lt;/figure&gt;
  		&lt;p&gt;It has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole worldIt has been exactly 3 years since I wrote my first blog series entitled “Flavorful Tuscany”, but starting it was definitely not easy. Back then, I didn’t know much about blogging, let alone think that one day it could become &lt;strong&gt;my full-time job&lt;/strong&gt;. Even though I had many recipes and food-related stories to tell, it never crossed my mind that I could be sharing them with the whole world&lt;/p&gt;
  		&lt;p&gt;I am now a &lt;strong&gt;full-time blogger&lt;/strong&gt; and the curator of the &lt;a href="https://ckeditor.com/ckeditor-4/#"&gt;Simply delicious newsletter&lt;/a&gt;, sharing stories about traveling and cooking, as well as tips on how to run a successful blog.&lt;/p&gt;
  		&lt;p&gt;If you are tempted by the idea of creating your own blog, please think about the following:&lt;/p&gt;
  		&lt;ul&gt;
  			&lt;li&gt;Your story (what do you want to tell your audience)&lt;/li&gt;
  			&lt;li&gt;Your audience (who do you write for)&lt;/li&gt;
  			&lt;li&gt;Your blog name and design&lt;/li&gt;
  		&lt;/ul&gt;
  		&lt;p&gt;After you get your head around these 3 essentials, all you have to do is grab your keyboard and the rest will follow.&lt;/p&gt;
  	</textarea>
    <button type="button" @click='print' name="button">Print me</button>
    <div id="testEditorOutput" v-html='contentHTMLTest'>
    </div>
  </div>
</template>

<script>
  export default {
    components: {
    },
    name: 'EditContent',
    data() {
      return {
        editor: {},
        title: "",
        description: "",
        contentHTMLTest: ""
      };
    },
    props: ['userId'],
    methods: {
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
      console.log("mounted");
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
