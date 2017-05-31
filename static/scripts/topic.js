const {SortableContainer, SortableElement, SortableHandle, arrayMove} = window.SortableHOC;

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
    }

    /**
     * Update title on each onChange of input field
     * @param {Object} event - Event object from onChange.
     */
    updateTitle(event) {
        this.props.onUpdate({
            title: event.target.value
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
                                <a className="btn btn-secondary" onClick={this.toggleHidden.bind(this)}>
                                    <i className={`fa fa-eye${this.props.hidden ? '-slash' : ''}`} />
                                </a>
                            </span>

                            <input
                                placeholder="Titel des Abschnitts"
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

                            <div className="input-group-btn">
                                <button className="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown">
                                    <i className="fa fa-cog"></i>
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <a className="dropdown-item text-danger" onClick={this.props.onRemove}>
                                        <span><i className="fa fa-trash" /> Entfernen</span>
                                    </a>
                                </div>
                            </div>

                            <DragHandle />
                        </div>
                    </div>
                    <div className="card-block">
                        <this.props.type {...this.props} />
                    </div>
                </div>
            </div>
        );
    }
};

TopicBlockWrapper.defaultProps = {
    type: '',
    title: '',
    content: {},
    hidden: false,
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
        const blocks = this.state.blocks;
        blocks.push({
            type: Block,
            component: Block.component,
            title: '',
            content: {},
            hidden: false
        });
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
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicText)}>+ Text</button>
                        <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicGeoGebra)}>+ GeoGebra Arbeitsblatt</button>
                        {/* <button type="button" className="btn btn-secondary" onClick={this.addBlock.bind(this, TopicResources)}>Material</button> */}
                    </div>
                </div>
            </div>
        );
    }
};


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
                throw `No class found for component "${component}".`
                break;
            case 'text':
                return TopicText;
                break;
            case 'resources':
                return TopicResources;
                break;
            case 'geoGebra':
                return TopicGeoGebra;
                break;
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
        const randomId = Math.random().toString(36).substr(2, 5);
        this.editorId = `editor_${randomId}`;
    }

    componentDidMount() {
        const storageContext = this.getStorageContext();
        CKEDITOR.replace(this.editorId, {
            extraPlugins: 'uploadimage',
            uploadUrl: '/files/upload/?path=' + storageContext,
            filebrowserBrowseUrl: '/files/' + storageContext,
            filebrowserUploadUrl: '/files/upload/?path=' + storageContext,
            filebrowserImageUploadUrl: '/files/upload/?path=' + storageContext,
            removeDialogTabs: 'link:upload;image:Upload;image:advanced;image:Link'
        });
        CKEDITOR.instances[this.editorId].on("change", function () {
            const data = CKEDITOR.instances[this.editorId].getData();
            this.updateText(data);
        }.bind(this));

        CKEDITOR.on( 'dialogDefinition', function( ev )
        {
            var dialogName = ev.data.name;
            var dialogDefinition = ev.data.definition;
            ev.data.definition.resizable = CKEDITOR.DIALOG_RESIZE_NONE;

            if ( dialogName == 'link' ) {
                var infoTab = dialogDefinition.getContents( 'info' );
                infoTab.remove( 'protocol' );
                dialogDefinition.removeContents( 'target' );
                dialogDefinition.removeContents( 'advanced' );
            }

            if ( dialogName == 'image' ) {
                dialogDefinition.removeContents( 'Link' );
                dialogDefinition.removeContents( 'advanced' );
                var infoTab = dialogDefinition.getContents( 'info' );
                infoTab.remove( 'txtBorder' );
                infoTab.remove( 'txtHSpace' );
                infoTab.remove( 'txtVSpace' );
                infoTab.remove( 'cmbAlign' );

                infoTab.elements[0].children[0].children[1].label = 'Datei auswählen';
            }
        });

        this.props.addOnSortEndCallback(function () {
            CKEDITOR.instances[this.editorId].setData((this.props.content || {}).text);
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
        const value = typeof(event) == 'string' ? event : event.target.value;
        this.props.onUpdate({
            content: {
                text: value
            }
        });
    }

    /**
     * Render the block (an textarea)
     */
    render() {
        return (
            <div>
                <textarea
                    className="form-control"
                    rows="10"
                    id={this.editorId}
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
     * Keep state in sync with input.
     */
    updateResource(event) {
        this.props.onUpdate(event.target.value);
    }

    /**
     * Render the resource field.
     * TODO: show a real resource and not just inputfield
     */
    render() {
        return (
            <div className="form-group">
                <div className="input-group">
                    <input
                        placeholder="Resources ID"
                        className="form-control"
                        type="text"
                        value={this.props.resource}
                        onChange={this.updateResource.bind(this)}
                        name={`contents[${this.props.position}][content][]`}
                    />
                    <span className="input-group-btn">
                        <button className="btn btn-danger btn-remove" type="button" onClick={this.props.onRemove}>
                            <i className="fa fa-minus" />
                        </button>
                    </span>
                </div>
            </div>
        );
    }
};


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
        const resources = this.props.content.resources || [];
        resources.push(resource);
        this.updateResources(resources);
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

                <div className="btn-group" role="group" >
                    <button type="button" className="btn btn-secondary btn-add" onClick={this.addResource.bind(this, '')}>+ Material</button>
                </div>
            </div>
        );
    }
};

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
        const value = typeof(event) == 'string' ? event : event.target.value;
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
                        title="Die Material-ID finden Sie in der URL zu dem GeoGebra-Arbeitsblatt, was sie online abgespeichert haben. Bei z.B. https://www.geogebra.org/m/e6g4adXp ist die Material-ID 'e6g4adXp'"><i className="fa fa-info-circle" /></a>
                </span>
                <input
                    className="form-control"
                    id={this.editorId}
                    onChange={this.updateMaterialId.bind(this)}
                    value={(this.props.content || {}).materialId}
                    placeholder="GeoGebra Material-ID eingeben, z.B. ZFTGX57r"
                    name={`contents[${this.props.position}][content][materialId]`}
                />
            </div>
        );
    }
};


/**
 * Render the virtual React DOM into an <div> in the current page.
 */
const $contentBlocksContainer = $('#content-blocks');

ReactDOM.render(
    <TopicBlockList />,
    $contentBlocksContainer[0]
);