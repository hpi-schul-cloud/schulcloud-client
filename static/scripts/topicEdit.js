import React from 'react';
import ReactDOM from 'react-dom';
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';

/**
 * A wrapper for each block including a title field, remove, sortable, ...
 * @extends React.Component
 */
class TopicBlockWrapper extends React.Component {
    /**
     * Initialize the Block wrapper.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
        this.state = {
            onBeforeRemoveCallbacks: []
        }
    }

    /**
     * Update title on each onChange of input field
     * @param {Object} event - Event object from onChange.
     */
    updateTitle(event) {
        this.props.onUpdate({
            title: ((event || {}).target || {}).value
        });
    }

    /**
     * Toggle hidden state of item
     */
    toggleHidden() {
        this.props.onUpdate({
            hidden: !this.props.hidden
        });
    }


    addOnBeforeRemoveCallback(cb) {
        let onBeforeRemoveCallbacks = this.state.onBeforeRemoveCallbacks;
        onBeforeRemoveCallbacks.push(cb);
        this.setState({
            onBeforeRemoveCallbacks
        });
    }

    onRemoveWithCallback() {
        if(this.state.onBeforeRemoveCallbacks.length) {
            this.state.onBeforeRemoveCallbacks.forEach(cb => {
                return cb();
            });
        }
        this.props.onRemove();
    }

    /**
     * Render block wrapper and the chosen type (this.props.type) within it.
     */
    render() {
        const DragHandle = SortableHandle(() => {
            return (
                <span className="input-group-addon">
                    <i className="fa fa-arrows move-handle" />
                </span>
            );
        });

        return (
            <div className={`content-block ${this.props.hidden ? 'content-block-hidden' : ''}`}>
                <div className="card">
                    <div className="card-header">
                        <div className="input-group">

                            <span className="input-group-btn">
                                <i className="fa fa-arrows move-handle" />
                                <a className="btn btn-secondary hidden-toggle"
                                   onClick={this.toggleHidden.bind(this)}
                                   data-toggle="tooltip"
                                   data-placement="top"
                                   title={this.props.hidden ? $t('topic.topicEdit.label.openSection') : $t('topic.topicEdit.label.lockSection')}
                                   data-original-title={this.props.hidden ? $t('topic.topicEdit.label.openSection') : $t('topic.topicEdit.label.lockSection')}
                                >
                                    <i className={`fa fa-eye${this.props.hidden ? '-slash' : ''}`} />
                                </a>
                            </span>

                            <input
                                placeholder={$t('topic.topicEdit.input.sectionTitle')}
                                value={this.props.title}
                                className="form-control"
                                onChange={this.updateTitle.bind(this)}
                                name={`contents[${this.props.position}][title]`}
                            />
                            <input
                                value={this.props.hidden}
                                type="hidden"
                                name={`contents[${this.props.position}][hidden]`}
                            />
                            <input
                                value={this.props.component}
                                type="hidden"
                                name={`contents[${this.props.position}][component]`}
                            />
                            <input
                                value={this.props.user}
                                type="hidden"
                                name={`contents[${this.props.position}][user]`}
                            />


                            <div className="input-group-btn">
                                <button className="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown">
                                    <i className="fa fa-cog"></i>
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <a className="dropdown-item text-danger" onClick={this.onRemoveWithCallback.bind(this)}>
                                        <span><i className="fa fa-trash" /> {$t('global.button.remove')}</span>
                                    </a>
                                </div>
                            </div>

                            <DragHandle />
                        </div>
                    </div>
                    <div className="card-block">
                        <this.props.type {...this.props} addOnBeforeRemoveCallback={this.addOnBeforeRemoveCallback.bind(this)} />
                    </div>
                </div>
            </div>
        );
    }
}

TopicBlockWrapper.defaultProps = {
    type: '',
    title: '',
    content: {},
    hidden: false,
    user : '',
    index: 0
};


/**
 * A wrapper/higher order component to make TopicBlockWrapper sortable
 * @extends SortableElement
 */
const SortableItem = SortableElement(({value, position, addOnSortEndCallback, onUpdate, onRemove}) => {
    return (
        <TopicBlockWrapper
            onUpdate={onUpdate}
            onRemove={onRemove}
            addOnSortEndCallback={addOnSortEndCallback}
            position={position}
            {...value}
        />
    );
});


/**
 * A wrapper/higher order component to define the list of draggable items.
 * @extends SortableContainer
 */
const SortableList = SortableContainer(({items, addOnSortEndCallback, onUpdate, onRemove}) => {
    return (
        <div>
            {items.map((value, index) => (
                <SortableItem
                    key={`item-${index}`}
                    onUpdate={onUpdate.bind(this, index)}
                    onRemove={onRemove.bind(this, index)}
                    addOnSortEndCallback={addOnSortEndCallback.bind(this)}
                    index={index}
                    position={index}
                    value={value}
                />
            ))}
        </div>
    );
});


/**
 * Class representing a dynamic list of content blocks.
 * @extends React.Component
 */
class TopicBlockList extends React.Component {
    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);

        const initialBlocks = this.loadState();

        this.state = {
            blocks: initialBlocks,
            etherpadBaseUrl: $contentBlocksContainer.data('etherpadbaseurl'),
            onSortEndCallbacks: []
        };
    }

    /**
     * Load stringified state from input field, parse it and return the parsed object.
     * This is used to load the data from the database.
     */
    loadState() {
        const blocks = $contentBlocksContainer.data('value') || [];
        return blocks.map(block => {
            block.type = TopicBlock.getClassForComponent(block.component);
            return block;
        });
    }

    /**
     * Update the array order after sorting.
     * @param {number} oldIndex - Previous index of the dragged object.
     * @param {number} newIndex - New index of the dragged object.
     */
    onSortEnd({oldIndex, newIndex}) {
        this.setState({
            blocks: arrayMove(this.state.blocks, oldIndex, newIndex)
        });

        if(this.state.onSortEndCallbacks.length) {
            this.state.onSortEndCallbacks.forEach(cb => {
                return cb();
            });
        }
    }

    /**
     * This function will be passed through the components so every one can use the onSortEnd event
     * @param {Function} cb - The callback that should be triggered
     */
    addOnSortEndCallback(cb) {
        let onSortEndCallbacks = this.state.onSortEndCallbacks;
        onSortEndCallbacks.push(cb);
        this.setState({
            onSortEndCallbacks
        });
    }

    /**
     * Add block object to list that is used to draw the topic block body.
     * @param {Object} Block - Class reference to type of block.
     */
    addBlock(Block) {
        const block = {
            type: Block,
            component: Block.component,
            title: '',
            content: {},
            hidden: false
        };
        if (block.component === 'Etherpad') {
            block.etherpadBaseUrl = this.state.etherpadBaseUrl;
        }
        const blocks = this.state.blocks;
        blocks.push(block);
        this.updateBlocks(blocks);
    }

    /**
     * Patch block object at specific index.
     * @param {number} index - The position of the block in the array of blocks.
     * @param {Object} block - The updated values.
     */
    updateBlock(index, block = {}) {
        const blocks = this.state.blocks;
        blocks[index] = Object.assign({}, blocks[index], block);
        this.updateBlocks(blocks);
    }

    /**
     * Update the list of blocks.
     */
    updateBlocks(blocks) {
        this.setState({
            blocks
        });
    }

    /**
     * Remove an block at the the "index" position in the array.
     * @param {number} index - Position of the block that should be removed.
     */
    removeBlock(index) {
        const blocks = this.state.blocks;
        blocks.splice(index, 1);
        this.updateBlocks(blocks);
    }

    /**
     * Render the list items.
     */
    render() {
        const neXboardEnabled = ($contentBlocksContainer.data('nexboardenabled') === true);
        return (
            <div>
                <SortableList
                    items={this.state.blocks || []}
                    onUpdate={this.updateBlock.bind(this)}
                    onRemove={this.removeBlock.bind(this)}
                    onSortEnd={this.onSortEnd.bind(this)}
                    addOnSortEndCallback={this.addOnSortEndCallback.bind(this)}
                    useDragHandle={true}
                />

                <div className="form-group">
                    <div className="btn-group" role="group" aria-label="Basic example">
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicText)}>{`+ ${$t('topic.topicEdit.button.text')}`}</button>
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicGeoGebra)}>{`+ ${$t('topic.topicEdit.button.geoGebraWorksheet')}`}</button>
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicResources)}>{`+ ${$t('topic.topicEdit.button.material')}`}</button>
                        {neXboardEnabled ? <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicNexboard)}>+ neXboard</button> : '' }
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicEtherpad)}>+ Etherpad</button>
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicInternal)}>{`+ ${$t('global.headline.task')}`}</button>
                    </div>
                </div>
            </div>
        );
    }
}


/**
 * Abstract class for topic blocks.
 * @extends React.Component
 */
class TopicBlock extends React.Component {
    constructor(props) {
        super(props);
    }

    /**
     * This function returns the name of the component that will be used to render the block in view mode.
     */
    static get component() {
        throw 'component() has to be implemented by children of TopicBlock.';
    }

    /**
     * This is kind of a registry for all possible types so when we load this from the database
     * we can initialize the blocks with the correct class
     */
    static getClassForComponent(component) {
        switch(component) {
            default:
                throw `No class found for component "${component}".`;
            case 'text':
                return TopicText;
            case 'resources':
                return TopicResources;
            case 'geoGebra':
                return TopicGeoGebra;
            case 'neXboard':
                return TopicNexboard;
            case 'Etherpad':
                return TopicEtherpad;
            case 'internal':
                return TopicInternal;
        }
    }
}


/**
 * Class representing a dynamic list of resources
 * @extends React.Component
 */
class TopicText extends TopicBlock {
    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);

        if(!(this.props.content || {}).editorId) {
            const randomId = Math.random().toString(36).substr(2, 5);
            this.editorId = `editor_${randomId}`;
            this.updateText((this.props.content || {}).text);
        }
    }

    componentDidMount() {
        const editorId = (this.props.content || {}).editorId || this.editorId;

        this.initEditor();

        CKEDITOR.on( 'dialogDefinition', function( ev ) {
            var dialogName = ev.data.name;
            var dialogDefinition = ev.data.definition;
            ev.data.definition.resizable = CKEDITOR.DIALOG_RESIZE_NONE;

            if ( dialogName == 'link' ) {
                dialogDefinition.removeContents( 'advanced' );
            }

            if ( dialogName == 'image' ) {
                dialogDefinition.removeContents( 'Link' );
                dialogDefinition.removeContents( 'advanced' );
                const infoTab = dialogDefinition.getContents( 'info' );
                infoTab.remove( 'txtBorder' );
                infoTab.remove( 'txtHSpace' );
                infoTab.remove( 'txtVSpace' );
                infoTab.remove( 'cmbAlign' );

                infoTab.elements[0].children[0].children[1].label = $t('global.label.chooseAFile');
            }
        });

        this.props.addOnSortEndCallback(() => {
            CKEDITOR.instances[editorId].setData((this.props.content || {}).text);
        });

        this.props.addOnBeforeRemoveCallback(() => {
            Object.values(CKEDITOR.instances).forEach(editor => {
                editor.destroy();
            });
        });
    }


    initEditor() {
        const storageContext = this.getStorageContext();

        const editorId = (this.props.content || {}).editorId || this.editorId;

        CKEDITOR.replace(editorId, {
            uploadUrl: '/files/upload/?path=' + storageContext,
            filebrowserBrowseUrl: '/files/' + storageContext,
            filebrowserUploadUrl: '/files/upload/?path=' + storageContext,
            filebrowserImageUploadUrl: '/files/upload/?path=' + storageContext,
		});

        CKEDITOR.instances[editorId].on("change", function () {
            const data = CKEDITOR.instances[editorId].getData();
            this.updateText(data);
        }.bind(this));

    }


    getStorageContext() {
        const url = window.location.pathname;
        const urlParts = url.split('/');

        if(urlParts[1] != 'courses') {
            throw new Error('Storage context should be the course');
        }

        const storageContext = urlParts[1] + '/' + urlParts[2];
        return storageContext;
    }

    /**
     * This function returns the name of the component that will be used to render the block in view mode.
     */
    static get component() {
        return 'text';
    }

    /**
     * Keep state in sync with input.
     */
    updateText(event) {
        const editorId = (this.props.content || {}).editorId || this.editorId;
        const value = typeof(event) == 'string' ? event : ((event || {}).target || {}).value;
        this.props.onUpdate({
            content: {
                text: value,
                editorId: editorId
            }
        });
    }

    componentDidUpdate() {
        const editorId = (this.props.content || {}).editorId || this.editorId;
        if(!CKEDITOR.instances[editorId]) {
            this.initEditor();
        }
    }

    /**
     * Render the block (an textarea)
     */
    render() {
        const editorId = (this.props.content || {}).editorId || this.editorId;
        return (
            <div>
                <textarea
                    className="form-control"
                    rows="10"
                    id={editorId}
                    onChange={this.updateText.bind(this)}
                    value={(this.props.content || {}).text}
                    name={`contents[${this.props.position}][content][text]`}
                />
            </div>
        );
    }
};


/**
 * Class representing a resource in the list of resources.
 * @extends React.Component
 */
class TopicResource extends React.Component {
    /**
     * Initialize the resource input field.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
    }

    /**
     * Render the resource field.
     * TODO: show a real resource and not just inputfield
     */
    render() {
        return (
            <div className="card">
                <div className="card-block">
                    <h4 className="card-title">
                        <a href={(this.props.resource || {}).url} target="_blank">
                            {(this.props.resource || {}).title}
                        </a>
                    </h4>
                    <p className="card-text">{(this.props.resource || {}).description}</p>
                </div>
                <div className="card-footer">
                    <small className="text-muted">via {(this.props.resource || {}).client}</small>
                    <a className="btn-remove-resource" onClick={this.props.onRemove}><i
                        className="fa fa-trash-o"></i></a>
                </div>
                <input
                    type="hidden"
                    value={(this.props.resource || {}).url}
                    name={`contents[${this.props.position}][content][resources][${this.props.index}][url]`}
                />
                <input
                    type="hidden"
                    value={(this.props.resource || {}).title}
                    name={`contents[${this.props.position}][content][resources][${this.props.index}][title]`}
                />
                <input
                    type="hidden"
                    value={(this.props.resource || {}).description}
                    name={`contents[${this.props.position}][content][resources][${this.props.index}][description]`}
                />
                <input
                    type="hidden"
                    value={(this.props.resource || {}).client}
                    name={`contents[${this.props.position}][content][resources][${this.props.index}][client]`}
                />
            </div>
        );
    }
}


/**
 * Class representing a dynamic list of resources
 * @extends React.Component
 */
class TopicResources extends TopicBlock {
    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
    }

    /**
     * This function returns the name of the component that will be used to render the block in view mode.
     */
    static get component() {
        return 'resources';
    }

    /**
     * Add new field into list of resources
     * @param {string} resource - ID of the resource
     */
    addResource(resource = '') {
        window.addResource = (resource) => {
            const resources = this.props.content.resources || [];
            resources.push(resource);
            this.updateResources(resources);
        };

        if(!resource) {
            let isCourseGroupTopic = $contentBlocksContainer.data('iscoursegroup') !== undefined;
            // open content search popup
            const resourcePopup = window.open('/content/?inline=1&isCourseGroupTopic=' + isCourseGroupTopic, "content-search",
				`width=1920, height=1080, fullscreen=yes, toolbar=no, location=no, directories=no, status=no, scrollbars=yes, resizable=yes`);
			resourcePopup.moveTo(0, 0);
            resourcePopup.focus();
        } else {
            window.addResource(resource);
        }
    }

    /**
     * Update an existing resource with a new resource ID
     * @param {number} index - Position of the resource in the list of resources.
     * @param {string} resource - ID of the resource
     */
    updateResource(index, resource) {
        const resources = this.props.content.resources;
        resources[index] = resource;
        this.updateResources(resources);
    }

    /**
     * Update the list of resources
     * @param {Array} resources - List of resources
     */
    updateResources(resources) {
        this.props.onUpdate({
            content: {
                resources
            }
        });
    }

    /**
     * Remove an item at the the "index" position in the array.
     * @param {number} index - Position of the item that should be removed.
     */
    removeResource(index) {
        const resources = this.props.content.resources || [];
        resources.splice(index, 1);
        this.updateResources(resources);
    }

    /**
     * Render the list items.
     */
    render() {
        const resources = (this.props.content || {}).resources || [];
        return (
            <div>
                <div className="card-columns">
                    {resources.map((item, index) => {
                        return (<TopicResource
                            key={index}
                            onUpdate={this.updateResource.bind(this, index)}
                            onRemove={this.removeResource.bind(this, index)}
                            position={this.props.position}
                            index={index}
                            resource={item}
                        />);
                    })}
                </div>

                <div className="btn-group" role="group" >
                    <button type="button" className="btn btn-secondary btn-add" onClick={this.addResource.bind(this, '')}>{`+ ${$t('topic.topicEdit.button.material')}`}</button>
                </div>
            </div>
        );
    }
}

/**
 * Class representing a geo gebra worksheet
 * @extends React.Component
 */
class TopicGeoGebra extends TopicBlock {
    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
        const randomId = Math.random().toString(36).substr(2, 5);
        this.editorId = `editor_${randomId}`;
    }

    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip();
    }

    /**
     * This function returns the name of the component that will be used to render the block in view mode.
     */
    static get component() {
        return 'geoGebra';
    }

    /**
     * Keep state in sync with input.
     */
    updateMaterialId(event) {
        const value = typeof(event) == 'string' ? event : ((event || {}).target || {}).value;
        this.props.onUpdate({
            content: {
                materialId: value
            }
        });
    }

    /**
     * Render the block (an textarea)
     */
    render() {
        return (
            <div className="input-group">
                <span className="input-group-btn">
                    <a
                        className="btn btn-secondary geo-gebra-info"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title={$t('topic.topicEdit.label.youllFindTheIdOn')}><i className="fa fa-info-circle" /></a>
                </span>
                <input
                    className="form-control"
                    id={this.editorId}
                    onChange={this.updateMaterialId.bind(this)}
                    value={(this.props.content || {}).materialId}
                    placeholder={$t('topic.topicEdit.input.GeoGebraEnterId')}
                    name={`contents[${this.props.position}][content][materialId]`}
                />
            </div>
        );
    }
}

/**
 * Class representing an internal link
 * @extends React.Component
 */
class TopicInternal extends TopicBlock {

    /**
     * generates the url-pattern that accepts homework links
     * Other types of content currently not supported or not useful.
     */
    generatePattern() {
        return `${window.location.origin}\/homework.*`;
    }

    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);

        this.state = {
            baseUrl: window.location.origin,
            pattern: this.generatePattern()
        };
    }


    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip();
    }

    /**
     * This function returns the name of the component that will be used to render the block in
     * view mode.
     */
    static get component() {
        return 'internal';
    }

    /**
     * Keep state in sync with input.
     */
    updateUrl(event) {
        const value = typeof(event) == 'string' ? event : ((event || {}).target || {}).value;
        this.setState({
            baseUrl: window.location.origin,
            pattern: this.generatePattern()
        });

        this.props.onUpdate({
            content: {
                url: value
            }
        });
    }

    /**
     * Render the block (an input field)
     */
    render() {
        return (
            <div>
                <label>Interner Link</label><br/>
                <div className="input-group">
                    <span className="input-group-btn">
                        <a
                            className="btn btn-secondary geo-gebra-info"
                            href="#"
                            data-toggle="tooltip"
                            data-placement="top"
                            title={$t('topic.topicEdit.label.theLinkHasToBeginWith', {'baseUrl' : this.state.baseUrl})}><i className="fa fa-info-circle" /></a>
                    </span>
                    <input
                        className="form-control"
                        name={`contents[${this.props.position}][content][url]`}
                        pattern={this.state.pattern}
                        onChange={this.updateUrl.bind(this)}
                        type="url"
                        required
                        placeholder={`${this.state.baseUrl}/homework/5aba1085b0efc43a64f1f5d2`}
                        value={(this.props.content || {}).url}
                    />
                </div>
            </div>
        );
    }
}

/**
 * Class representing an Etherpad
 * @extends React.Component
 */
class TopicEtherpad extends TopicBlock {

    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
        this.props.content = this.props.content || {};
        const randomId = Math.random().toString(36).substr(2, 5);
        this.props.content.url = this.props.content.url || `${props.etherpadBaseUrl}${randomId}`;
    }

    /**
     * This function returns the name of the component that will be used to render the block in
     * view mode.
     */
    static get component() {
        return 'Etherpad';
    }

    /**
     * Render the block (an textarea)
     */
    render() {
        return (
            <div>
                <div type="hidden" className="form-group">
                    <label>{$t('topic.topicEdit.label.nameOfEtherpad')}</label>
                    <input className="form-control"
                        name={`contents[${this.props.position}][content][title]`}
                        type="text" placeholder={$t('topic.topicEdit.input.brainstormAboutXYZ')}
                        value={this.props.content.title}/>
                </div>
                <div className="form-group">
                    <label>{$t('topic.topicEdit.label.descriptionEtherpad')}</label>
                    <textarea className="form-control"
                        name={`contents[${this.props.position}][content][description]`}
                        placeholder={$t('topic.topicEdit.input.createsListInEtherpad')}>
                        {this.props.content.description}
                    </textarea>
                </div>
                <input type="hidden" name={`contents[${this.props.position}][content][url]`}
                       value={this.props.content.url} />
            </div>
        );
    }
}

/**
 * Class representing a neXboard
 * @extends React.Component
 */
class TopicNexboard extends TopicBlock {

    /**
     * Initialize the list.
     * @param {Object} props - Properties from React Component.
     */
    constructor(props) {
        super(props);
       // console.log(content);

        this.state = {
            newBoard : 0,
            id : Math.random().toString(36).substr(2, 5),
            boards: []
        };
        this.handleChange = this.handleChange.bind(this);

    }

    componentDidMount() {
        $.getJSON("nexboard/boards")
            .then(boards => {
                this.setState({boards:boards});
            });
        $("select[id="+this.state.id+"]").chosen();
        $("select[id="+this.state.id+"]").on('change', this.handleChange);
    }


    componentDidUpdate() {
        $(".chosen-select").trigger("chosen:updated");
    }

    handleChange() {
        var id = $("select[id="+this.state.id+"]").find("option:selected").val();

        if (id == this.state.newBoard){
            return 0;
        }
        this.state.boards.map(board => {
            board = board.content;
            if(board.board === id && board.title != ""){
                const content = this.props.content;
                content.board = board.board;
                content.url = board.url;
                this.props.onUpdate({
                    content: content
                });
                return 0;
        }});
    }

    /**
     * This function returns the name of the component that will be used to render the block in view mode.
     */
    static get component() {
        return 'neXboard';
    }

    /**
     * Render the block (an textarea)
     */
    render() {
        return (
            <div>
                <div type="hidden" className="form-group">
                    <label>{$t('topic.topicEdit.label.nameOfNeXboard')}</label>
                    <input required className="form-control" name={`contents[${this.props.position}][content][title]`}
                           type="text" placeholder={$t('topic.topicEdit.input.brainstormAboutXYZ')} value={(this.props.content || {}).title}/>
                </div>
                <div className="form-group">
                    <label>{$t('topic.topicEdit.label.descriptionNeXboard')}</label>
                    <textarea className="form-control" name={`contents[${this.props.position}][content][description]`}
                              placeholder={$t('topic.topicEdit.input.createsListInNeXboard')}>
                        {(this.props.content || {}).description}
                    </textarea>
                </div>
				<div className="form-group">
                    <label>{$t('topic.topicEdit.label.selectNeXboard')}</label>
                    <select name={`contents[${this.props.position}][content][board]`}
                            className="chosen-select"
                            data-placeholder={$t('topic.topicEdit.input.selectNeXboard')}
                            id={(this.state.id)}
                            value={(this.props.content || {}).board}>
                        {(this.props.content || {}).board ? <option value={this.props.content.board}>{$t('topic.topicEdit.input.keepNeXboard')}</option> : ''}
                        <option value={this.state.newBoard} >{$t('topic.topicEdit.input.createNewNeXboard')}</option>
                    </select>
				</div>
                <input type="hidden" name={`contents[${this.props.position}][content][url]`}
                       value={(this.props.content || {}).url } />
            </div>
		);
	}
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
const $contentBlocksContainer = $('#content-blocks');

ReactDOM.render(
    <TopicBlockList />,
    $contentBlocksContainer[0]
);
