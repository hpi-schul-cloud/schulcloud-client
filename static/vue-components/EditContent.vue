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
      &lt;h2 style="text-align: center;"&gt;The Flavorful Tuscany Meetup&lt;/h2&gt;
		&lt;p style="text-align: center;"&gt;&lt;span style="color: #007ac9;"&gt;&lt;strong&gt;Welcome letter&lt;/strong&gt;&lt;/span&gt;&lt;/p&gt;
		&lt;p&gt;Dear Guest,&lt;/p&gt;
		&lt;p&gt;We are delighted to welcome you to the annual &lt;em&gt;Flavorful Tuscany Meetup&lt;/em&gt; and hope you will enjoy the programme as well as your stay at the Bilancino Hotel.&lt;/p&gt;
		&lt;p&gt;Please find below the full schedule of the event.&lt;/p&gt;
		&lt;table class="schedule" cellpadding="15" cellspacing="0" style="border-collapse:collapse;width:100%;"&gt;
			&lt;thead&gt;
				&lt;tr&gt;
					&lt;th colspan="2" scope="col" style="background-color: #F2F9FF; text-align: center; font-size: 21px;"&gt;&lt;span&gt;Saturday, July 14&lt;/span&gt;&lt;/th&gt;
				&lt;/tr&gt;
			&lt;/thead&gt;
			&lt;tbody&gt;
				&lt;tr&gt;
					&lt;td style="white-space:nowrap;"&gt;&lt;span&gt;9:30 AM - 11:30 AM&lt;/span&gt;&lt;/td&gt;
					&lt;td&gt;&lt;span&gt;Americano vs. Brewed - “know your coffee” session with &lt;strong&gt;Stefano Garau&lt;/strong&gt;&lt;/span&gt;&lt;/td&gt;
				&lt;/tr&gt;
				&lt;tr&gt;
					&lt;td style="white-space:nowrap;"&gt;&lt;span&gt;1:00 PM - 3:00 PM&lt;/span&gt;&lt;/td&gt;
					&lt;td&gt;&lt;span&gt;Pappardelle al pomodoro - live cooking session with &lt;strong&gt;Rita Fresco&lt;/strong&gt;&lt;/span&gt;&lt;/td&gt;
				&lt;/tr&gt;
				&lt;tr&gt;
					&lt;td style="white-space:nowrap;"&gt;&lt;span&gt;5:00 PM - 8:00 PM&lt;/span&gt;&lt;/td&gt;
					&lt;td&gt;&lt;span&gt;Tuscan vineyards at a glance - wine-tasting session with &lt;strong&gt;Frederico Riscoli&lt;/strong&gt;&lt;/span&gt;&lt;/td&gt;
				&lt;/tr&gt;
			&lt;/tbody&gt;
		&lt;/table&gt;
		&lt;blockquote&gt;
			&lt;p&gt;The annual Flavorful Tuscany meetups are always a culinary discovery. You get the best of Tuscan flavors during an intense one-day stay at one of the top hotels of the region. All the sessions are lead by top chefs passionate about their profession. I would certainly recommend to save the date in your calendar for this one!&lt;/p&gt;
			&lt;p&gt;Angelina Calvino, food journalist&lt;/p&gt;
		&lt;/blockquote&gt;
		&lt;p&gt;Please arrive at the Bilancino Hotel reception desk at least &lt;strong&gt;half an hour earlier&lt;/strong&gt; to make sure that the registration process goes as smoothly as possible.&lt;/p&gt;
		&lt;p&gt;We look forward to welcoming you to the event.&lt;/p&gt;
		&lt;p&gt;&lt;/p&gt;
		&lt;p&gt;&lt;strong&gt;Victoria Valc&lt;/strong&gt;&lt;/p&gt;
		&lt;p&gt;&lt;strong&gt;Event Manager&lt;/strong&gt;&lt;/p&gt;
		&lt;p&gt;&lt;strong&gt;Bilancino Hotel&lt;/strong&gt;&lt;/p&gt;
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
      // this.editor = CKEDITOR.replace( 'editor', {
      //     toolbar: [
      //       { name: 'clipboard', items: [ 'Undo', 'Redo' ] },
      //       { name: 'styles', items: [ 'Format' ] },
      //       { name: 'basicstyles', items: [ 'Bold', 'Italic' ] },
      //       { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote' ] },
      //       { name: 'links', items: [ 'Link', 'Unlink' ] },
      //       { name: 'insert', items: [ 'Image', 'EmbedSemantic', 'Table' ] },
      //     ],
      //     customConfig: '',
      //     defaultLanguage: 'de',
      //     // Enabling extra plugins, available in the standard-all preset: http://ckeditor.com/presets-all
      //     extraPlugins: 'uploadimage,autoembed,image2,uploadfile',
      //     /*********************** File management support ***********************/
      //     // See http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_ckfinder_integration
      //     // filebrowserBrowseUrl: 'http://example.com/ckfinder/ckfinder.html',
      //     filebrowserUploadUrl: '/files/uploadToShare',
      //     // Remove the default image plugin because image2, which offers captions for images, was enabled above.
      //     removePlugins: 'image',
      //     // Make the editing area as big as A4 print.
      //     height: 1000,
      //     width: 800,
      //     // An array of stylesheets to style the WYSIWYG area.
      //     // Note: it is recommended to keep your own styles in a separate file in order to make future updates painless.
      //     contentsCss: [ 'https://cdn.ckeditor.com/4.8.0/standard-all/contents.css', 'mystyles.css' ],
      //     // This is optional, but will let us define multiple different styles for multiple editors using the same CSS file.
      //     bodyClass: 'article-editor',
      //     // Reduce the list of block elements listed in the Format dropdown to the most commonly used.
      //     // format_tags: 'p;h1;h2;h3;pre', TODO: Comment in again if needed?
      //     // Simplify the Image and Link dialog windows. The "Advanced" tab is not needed in most cases.
      //     removeDialogTabs: 'image:advanced;link:advanced',
      //     // Define the list of styles which should be available in the Styles dropdown list.
      //     // If the "class" attribute is used to style an element, make sure to define the style for the class in "mystyles.css"
      //     // (and on your website so that it rendered in the same way).
      //     // Note: by default CKEditor looks for styles.js file. Defining stylesSet inline (as below) stops CKEditor from loading
      //     // that file, which means one HTTP request less (and a faster startup).
      //     // For more information see http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_styles
      //     stylesSet: [
      //       /* Inline Styles */
      //       { name: 'Marker',			element: 'span', attributes: { 'class': 'marker' } },
      //       { name: 'Cited Work',		element: 'cite' },
      //       { name: 'Inline Quotation',	element: 'q' },
      //       /* Object Styles */
      //       {
      //         name: 'Special Container',
      //         element: 'div',
      //         styles: {
      //           padding: '5px 10px',
      //           background: '#eee',
      //           border: '1px solid #ccc'
      //         }
      //       },
      //       {
      //         name: 'Compact table',
      //         element: 'table',
      //         attributes: {
      //           cellpadding: '5',
      //           cellspacing: '0',
      //           border: '1',
      //           bordercolor: '#ccc'
      //         },
      //         styles: {
      //           'border-collapse': 'collapse'
      //         }
      //       },
      //       { name: 'Borderless Table',		element: 'table',	styles: { 'border-style': 'hidden', 'background-color': '#E6E6FA' } },
      //       { name: 'Square Bulleted List',	element: 'ul',		styles: { 'list-style-type': 'square' } },
      //       /* Widget Styles */
      //       // We use this one to style the brownie picture.
      //       { name: 'Illustration', type: 'widget', widget: 'image', attributes: { 'class': 'image-illustration' } },
      //       // Media embed
      //       { name: '240p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-240p' } },
      //       { name: '360p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-360p' } },
      //       { name: '480p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-480p' } },
      //       { name: '720p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-720p' } },
      //       { name: '1080p', type: 'widget', widget: 'embedSemantic', attributes: { 'class': 'embed-1080p' } }
      //     ]
      // } );
      this.editor = CKEDITOR.replace( 'editor', {
    		// Define the toolbar: http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_toolbar
    		// The full preset from CDN which we used as a base provides more features than we need.
    		// Also by default it comes with a 3-line toolbar. Here we put all buttons in a single row.
    		toolbar: [
    			{ name: 'document', items: [ 'Print' ] },
    			{ name: 'clipboard', items: [ 'Undo', 'Redo' ] },
    			{ name: 'styles', items: [ 'Format', 'Font', 'FontSize' ] },
    			{ name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'RemoveFormat', 'CopyFormatting' ] },
    			{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
    			{ name: 'align', items: [ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
    			{ name: 'links', items: [ 'Link', 'Unlink' ] },
    			{ name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote' ] },
    			{ name: 'insert', items: [ 'Image', 'Table', 'Pagebreak' ] },
    			{ name: 'tools', items: [ 'Maximize' ] },
    			{ name: 'editing', items: [ 'Scayt' ] }
    		],
    		// Since we define all configuration options here, let's instruct CKEditor to not load config.js which it does by default.
    		// One HTTP request less will result in a faster startup time.
    		// For more information check http://docs.ckeditor.com/ckeditor4/docs/#!/api/CKEDITOR.config-cfg-customConfig
    		customConfig: '',
    		// Sometimes applications that convert HTML to PDF prefer setting image width through attributes instead of CSS styles.
    		// For more information check:
    		//  - About Advanced Content Filter: http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_advanced_content_filter
    		//  - About Disallowed Content: http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_disallowed_content
    		//  - About Allowed Content: http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_allowed_content_rules
    		disallowedContent: 'img{width,height,float}', //TODO: check
    		extraAllowedContent: 'img[width,height,align]',
    		// Enabling extra plugins, available in the full-all preset: http://ckeditor.com/presets-all
    		extraPlugins: 'tableresize,uploadimage,uploadfile,pagebreak', // TODO: image or image2?
        // Remove the default image plugin because image2, which offers captions for images, was enabled above.
        // removePlugins: 'image', // TODO: needed?
    		/*********************** File management support ***********************/
    		// In order to turn on support for file uploads, CKEditor has to be configured to use some server side
    		// solution with file upload/management capabilities, like for example CKFinder.
    		// For more information see http://docs.ckeditor.com/ckeditor4/docs/#!/guide/dev_ckfinder_integration
    		// Uncomment and correct these lines after you setup your local CKFinder instance.
    		// filebrowserBrowseUrl: 'http://example.com/ckfinder/ckfinder.html',
    		// filebrowserUploadUrl: 'http://example.com/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files',
    		/*********************** File management support ***********************/
    		// Make the editing area bigger than default.
    		height: 800,
    		// An array of stylesheets to style the WYSIWYG area.
    		// Note: it is recommended to keep your own styles in a separate file in order to make future updates painless.
    		contentsCss: [ 'https://cdn.ckeditor.com/4.8.0/full-all/contents.css', 'mystyles.css' ],
    		// This is optional, but will let us define multiple different styles for multiple editors using the same CSS file.
    		bodyClass: 'document-editor',
    		// Reduce the list of block elements listed in the Format dropdown to the most commonly used.
    		format_tags: 'p;h1;h2;h3;pre',
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
    			{ name: 'Marker', element: 'span', attributes: { 'class': 'marker' } },
    			{ name: 'Cited Work', element: 'cite' },
    			{ name: 'Inline Quotation', element: 'q' },
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
    			{ name: 'Borderless Table', element: 'table', styles: { 'border-style': 'hidden', 'background-color': '#E6E6FA' } },
    			{ name: 'Square Bulleted List', element: 'ul', styles: { 'list-style-type': 'square' } }
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
