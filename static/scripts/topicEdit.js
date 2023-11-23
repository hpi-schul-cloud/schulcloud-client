/* eslint-disable no-use-before-define */
/* eslint-disable max-classes-per-file */
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import React from 'react';
import ReactDOM from 'react-dom';
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import shortid from 'shortid';
import ckeditorConfig from './ckeditor/ckeditor-config';
import showFallbackImageOnError from './helpers/showFallbackImageOnError';

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
			onBeforeRemoveCallbacks: [],
		};
	}

	/**
     * Update title on each onChange of input field
     * @param {Object} event - Event object from onChange.
     */
	updateTitle(event) {
		this.props.onUpdate({
			title: ((event || {}).target || {}).value,
		});
	}

	/**
     * Toggle hidden state of item
     */
	toggleHidden() {
		this.props.onUpdate({
			hidden: !this.props.hidden,
		});
	}

	addOnBeforeRemoveCallback(cb) {
		const { onBeforeRemoveCallbacks } = this.state;
		onBeforeRemoveCallbacks.push(cb);
		this.setState({
			onBeforeRemoveCallbacks,
		});
	}

	onRemoveWithCallback() {
		if (this.state.onBeforeRemoveCallbacks.length) {
			this.state.onBeforeRemoveCallbacks.forEach((cb) => cb());
		}
		this.props.onRemove();
	}

	/**
     * Render block wrapper and the chosen type (this.props.type) within it.
     */
	render() {
		const DragHandle = SortableHandle(() => (
				<span tabindex={0} className="input-group-addon"
					aria-label={$t('topic.topicEdit.aria_label.moveSectionWithKeys')}>
                    <i className="fa fa-arrows move-handle" />
                </span>
		));

		return (
            <div className={`content-block ${this.props.hidden ? 'content-block-hidden' : ''}`}>
                <div className="card"
					data-testid={`topic-content-element-${this.props.component}-${this.props.position}`}>
                    <div className="card-header"
						data-testid={`topic-card-header-${this.props.position}`}>
                        <div className="input-group">

                            <span className="input-group-btn">
                                <i className="fa fa-arrows move-handle" />
                                <button className="btn btn-secondary hidden-toggle"
                                   onClick={this.toggleHidden.bind(this)}
                                   data-toggle="tooltip"
                                   data-placement="top"
                                   aria-label={
										this.props.hidden ? $t('topic.topicEdit.label.openSection')
											: $t('topic.topicEdit.label.lockSection')}
                                   data-original-title={
										this.props.hidden ? $t('topic.topicEdit.label.openSection')
											: $t('topic.topicEdit.label.lockSection')}
                                >
                                    <i className={`fa fa-eye${this.props.hidden ? '-slash' : ''}`} />
                                </button>
                            </span>

                            <input
								aria-label={$t('topic.topicEdit.input.sectionTitle')}
                                placeholder={$t('topic.topicEdit.input.sectionTitle')}
                                value={this.props.title}
                                className="form-control"
                                onChange={this.updateTitle.bind(this)}
								name={`contents[${this.props.position}][title]`}
								required
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
								<button
									aria-label={$t('global.label.settings')}
									className="btn btn-secondary dropdown-toggle"
									data-testid={`topic-dropdown-toggle-element-${this.props.position}`}
									type="button"
									data-toggle="dropdown">
                                    <i className="fa fa-cog"></i>
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <button
										className="dropdown-item text-danger"
										onClick={this.onRemoveWithCallback.bind(this)}
										data-testid={`topic-dropdown-option-delete-${this.props.position}`}>
                                        <span>
											<i className="fa fa-trash" aria-hidden="true"/> {$t('global.button.remove')}
										</span>
                                    </button>
                                </div>
                            </div>

                            <DragHandle />
                        </div>
                    </div>
                    <div className="card-block"
						data-testid={`topic-card-block-${this.props.position}`}>
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
	user: '',
	index: 0,
};

/**
 * A wrapper/higher order component to make TopicBlockWrapper sortable
 * @extends SortableElement
 */
const SortableItem = SortableElement(({
	value, position, addOnSortEndCallback, onUpdate, onRemove,
}) => (
        <TopicBlockWrapper
            onUpdate={onUpdate}
            onRemove={onRemove}
            addOnSortEndCallback={addOnSortEndCallback}
            position={position}
            {...value}
        />
));

/**
 * A wrapper/higher order component to define the list of draggable items.
 * @extends SortableContainer
 */
const SortableList = SortableContainer(({
	items, addOnSortEndCallback, onUpdate, onRemove,
}) => (
        <div>
            {items.map((value, index) => (
                <SortableItem
                    key={`item-${value._id ? value._id : value.key}`}
                    onUpdate={onUpdate.bind(this, index)}
                    onRemove={onRemove.bind(this, index)}
                    addOnSortEndCallback={addOnSortEndCallback.bind(this)}
                    index={index}
                    position={index}
                    value={value}
                />
            ))}
        </div>
));

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
			onSortEndCallbacks: [],
		};
	}

	/**
     * Load stringified state from input field, parse it and return the parsed object.
     * This is used to load the data from the database.
     */
	loadState() {
		const blocks = $contentBlocksContainer.data('value') || [];
		return blocks.map((block) => {
			block.key = shortid.generate();
			block.type = TopicBlock.getClassForComponent(block.component);
			block.parentId = $contentBlocksContainer.data('parent-id');
			block.schoolId = $contentBlocksContainer.data('school-id');
			block.parentType = $contentBlocksContainer.data('parent-type');

			return block;
		});
	}

	/**
     * Update the array order after sorting.
     * @param {number} oldIndex - Previous index of the dragged object.
     * @param {number} newIndex - New index of the dragged object.
     */
	onSortEnd({ oldIndex, newIndex }) {
		this.setState({
			blocks: arrayMove(this.state.blocks, oldIndex, newIndex),
		});

		if (this.state.onSortEndCallbacks.length) {
			this.state.onSortEndCallbacks.forEach((cb) => cb());
		}
	}

	/**
     * This function will be passed through the components so every one can use the onSortEnd event
     * @param {Function} cb - The callback that should be triggered
     */
	addOnSortEndCallback(cb) {
		const { onSortEndCallbacks } = this.state;
		onSortEndCallbacks.push(cb);
		this.setState({
			onSortEndCallbacks,
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
			hidden: false,
			key: shortid.generate(),
		};

		if (block.component === 'Etherpad') {
			block.etherpadBaseUrl = this.state.etherpadBaseUrl;
		}

		block.parentId = $contentBlocksContainer.data('parent-id');
		block.schoolId = $contentBlocksContainer.data('school-id');
		block.parentType = $contentBlocksContainer.data('parent-type');

		const { blocks } = this.state;
		blocks.push(block);
		this.updateBlocks(blocks);
	}

	/**
     * Patch block object at specific index.
     * @param {number} index - The position of the block in the array of blocks.
     * @param {Object} block - The updated values.
     */
	updateBlock(index, block = {}) {
		const { blocks } = this.state;
		blocks[index] = { ...blocks[index], ...block };
		this.updateBlocks(blocks);
	}

	/**
     * Update the list of blocks.
     */
	updateBlocks(blocks) {
		this.setState({
			blocks,
		});
	}

	/**
     * Remove an block at the the "index" position in the array.
     * @param {number} index - Position of the block that should be removed.
     */
	removeBlock(index) {
		const { blocks } = this.state;
		blocks.splice(index, 1);
		this.updateBlocks(blocks);
	}

	/**
     * Render the list items.
     */
	render() {
		const h5pEditorEnabled = ($contentBlocksContainer.data('h5peditorenabled') === true);
		return (
            <div>
                <SortableList
                    items={this.state.blocks || []}
                    onUpdate={this.updateBlock.bind(this)}
                    onRemove={this.removeBlock.bind(this)}
                    onSortEnd={this.onSortEnd.bind(this)}
                    addOnSortEndCallback={this.addOnSortEndCallback.bind(this)}
					useDragHandle={true}
					keyCodes={{
						lift: [32, 13],
						drop: [32, 13],
						cancel: [27],
						up: [38, 87],
						down: [40, 83],
					}}
                />

                <div className="form-group">
                    <div className="btn-group" role="group" aria-label={$t('topic.topicEdit.aria_label.chooseContent')}>
						<button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-text-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicText)}>
								{`+ ${$t('topic.topicEdit.button.text')}`}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-geogebra-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicGeoGebra)}>
								{`+ ${$t('topic.topicEdit.button.geoGebraWorksheet')}`}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-material-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicResources)}>
								{`+ ${$t('topic.topicEdit.button.material')}`}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-etherpad-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicEtherpad)}>
								{`+ ${$t('topic.topicEdit.button.etherpad')}`}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-task-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicInternal)}>
								{`+ ${$t('global.headline.task')}`}
						</button>
						{h5pEditorEnabled ? <button
							type="button"
							className="btn btn-secondary"
							data-testid="topic-addcontent-h5p-btn"
							aria-label={$t('global.button.add')}
							onClick={this.addBlock.bind(this, TopicH5P)}>
								{`+ ${$t('topic.topicEdit.button.h5p')}`}
						</button> : ''
						}
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
		switch (component) {
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
			case 'H5P':
				return TopicH5P;
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

		if (!(this.props.content || {}).editorId) {
			const randomId = Math.random().toString(36).substr(2, 5);
			this.editorId = `editor_${randomId}`;
			this.updateText((this.props.content || {}).text);
		}
		this.editor = undefined;
	}

	componentDidMount() {
		const editorId = (this.props.content || {}).editorId || this.editorId;
		this.initEditor(this.props.parentId);
	}

	async initEditor(parentId) {
		const storageContext = this.getStorageContext();

		const editorId = (this.props.content || {}).editorId || this.editorId;
		ckeditorConfig.filebrowser.browseUrl = `/files/${storageContext}`;

		const editor = await ClassicEditor.create(document.querySelector(`#${editorId}`), ckeditorConfig);

		editor.on('change:data', () => {
			this.updateText(editor.getData());
		});

		if (!parentId) {
			editor.commands.get('imagebrowser').forceDisabled();
			editor.commands.get('audiobrowser').forceDisabled();
			editor.commands.get('videobrowser').forceDisabled();
		}

		showFallbackImageOnError();
	}

	getStorageContext() {
		const url = window.location.pathname;
		const urlParts = url.split('/');

		if (urlParts[1] != 'courses') {
			throw new Error('Storage context should be the course');
		}

		const storageContext = `${urlParts[1]}/${urlParts[2]}`;
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
		const value = typeof (event) === 'string' ? event : ((event || {}).target || {}).value;
		this.props.onUpdate({
			content: {
				text: value,
				editorId,
			},
		});
	}

	/**
     * Render the block (an textarea)
     */
	render() {
		const editorId = (this.props.content || {}).editorId || this.editorId;
		const infoBox = <div class="alert info-custom">
							<div className="fa fa-info-circle" />
							{$t('files.text.uploadAfterFirstSave')}
						</div>;

		return (<>
			{!this.props.parentId ? infoBox : null}
            <div>
                <textarea
                    className="form-control ckeditor"
                    rows="10"
                    id={editorId}
                    onChange={this.updateText.bind(this)}
                    value={(this.props.content || {}).text}
                    name={`contents[${this.props.position}][content][text]`}
					data-parent-id={this.props.parentId}
					data-school-id={this.props.schoolId}
					data-parent-type={this.props.parentType}
                />
            </div>
		</>
		);
	}
}

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
					{/* Show proper provider.
					TODO: show a real provider instead of Schul-cloud once they are available */}
                    {/* <small className="text-muted">via {(this.props.resource || {}).client}</small> */}
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
				<input
					type="hidden"
					value={(this.props.resource || {}).merlinReference}
					name={`contents[${this.props.position}][content][resources][${this.props.index}][merlinReference]`}
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

		if (!resource) {
			const isCourseGroupTopic = $contentBlocksContainer.data('iscoursegroup') !== undefined;
			// open content search popup
			const resourcePopup = window.open(`/content/?inline=1&isCourseGroupTopic=${isCourseGroupTopic}`, 'content-search',
				'width=1920, height=1080, fullscreen=yes, toolbar=no, location=no, directories=no, status=no, scrollbars=yes, resizable=yes');
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
		const { resources } = this.props.content;
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
				resources,
			},
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
                    {resources.map((item, index) => (<TopicResource
                            key={index}
                            onUpdate={this.updateResource.bind(this, index)}
                            onRemove={this.removeResource.bind(this, index)}
                            position={this.props.position}
                            index={index}
                            resource={item}
                        />))}
                </div>

                <div className="btn-group" role="group" >
                    <button type="button" className="btn btn-secondary btn-add" data-testid="topic-material-addmaterial-btn" onClick={this.addResource.bind(this, '')}>{`+ ${$t('topic.topicEdit.button.material')}`}</button>
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
		const value = typeof (event) === 'string' ? event : ((event || {}).target || {}).value;
		this.props.onUpdate({
			content: {
				materialId: value,
			},
		});
	}

	/**
     * Render the block (an textarea)
     */
	render() {
		return (
            <div className="input-group">
                <span className="input-group-btn">
                    <span
                        className="btn btn-secondary geo-gebra-info"
                        data-toggle="tooltip"
                        tabindex="0"
                        data-placement="top"
                        title={$t('topic.topicEdit.label.youllFindTheIdOn')}><i className="fa fa-info-circle" /></span>
                </span>
                <input
					className="form-control"
					aria-label={$t('topic.topicEdit.aria_label.geoGebraID')}
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
			pattern: this.generatePattern(),
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
		const value = typeof (event) === 'string' ? event : ((event || {}).target || {}).value;
		this.setState({
			baseUrl: window.location.origin,
			pattern: this.generatePattern(),
		});

		this.props.onUpdate({
			content: {
				url: value,
			},
		});
	}

	/**
     * Render the block (an input field)
     */
	render() {
		return (
            <div>
                <label for={`internalLinkInput${this.props.position}`}>
					{$t('topic.topicEdit.label.internalLink')}
				</label><br/>
                <div className="input-group">
                    <span className="input-group-btn">
                        <span
                            className="btn btn-secondary geo-gebra-info"
                            data-toggle="tooltip"
                            tabindex="0"
                            data-placement="top"
                            title={$t('topic.topicEdit.label.theLinkHasToBeginWith', { baseUrl: this.state.baseUrl })}>
								<i className="fa fa-info-circle" />
						</span>
                    </span>
                    <input
						id={`internalLinkInput${this.props.position}`}
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
                <div type="hidden" className="form-group" style={{ display: 'none' }}>
                    <label>{$t('topic.topicEdit.label.nameOfEtherpad')}</label>
                    <input className="form-control"
                        name={`contents[${this.props.position}][content][title]`}
                        type="text" placeholder={$t('topic.topicEdit.input.brainstormAboutXYZ')}
                        value={this.props.content.title}/>
                </div>
                <div className="form-group">
                    <label for={`EtherpadDescInput${this.props.position}`}>
						{$t('topic.topicEdit.label.descriptionEtherpad')}
					</label>
					<textarea className="form-control"
						id={`EtherpadDescInput${this.props.position}`}
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

		this.state = {
			newBoard: 0,
			id: Math.random().toString(36).substr(2, 5),
			boards: [],
		};
		this.handleChange = this.handleChange.bind(this);
	}

	componentDidMount() {
		$.getJSON('nexboard/boards')
			.then((boards) => {
				this.setState({ boards });
			});
		$(`select[id=${this.state.id}]`).chosen();
		$(`select[id=${this.state.id}]`).on('change', this.handleChange);
	}

	componentDidUpdate() {
		$('.chosen-select').trigger('chosen:updated');
	}

	handleChange() {
		const id = $(`select[id=${this.state.id}]`).find('option:selected').val();

		if (id == this.state.newBoard) {
			return 0;
		}
		this.state.boards.map((board) => {
			board = board.content;
			if (board.board === id && board.title != '') {
				const { content } = this.props;
				content.board = board.board;
				content.url = board.url;
				this.props.onUpdate({
					content,
				});
				return 0;
			}
		});
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
 * Class representing H5P
 * @extends React.Component<{ content: { contentId: string } }>
 */
class TopicH5P extends TopicBlock {
	/**
	* Initialize the topic.
	* @param {Object} props - Properties from React Component.
	*/
	constructor(props) {
		super(props);
	}

	/**
	* This function returns the name of the component that will be used to render the block in view mode.
	*/
	static get component() {
		return 'H5P';
	}

	openEditor(id) {
		const w = 1280;
		const h = 1080;

		const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
		const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);

		const { parentType, parentId } = this.props;

		const editorPopup = window.open(
			`/h5p/editor/${id ?? ''}?parentType=${parentType}&parentId=${parentId}&inline=1`,
			'h5p-editor',
			`width=${w}, height=${h}, left=${x}, top=${y},
			fullscreen=yes, toolbar=no, location=no, directories=no, status=no, scrollbars=yes, resizable=yes`,
		);

		editorPopup.addEventListener('save-content', (event) => {
			this.props.onUpdate({ content: event.detail });
		});

		editorPopup.focus();
	}

	/**
	* Render the block (an textarea)
	*/
	render() {
		const infoBox = <div class="alert info-custom">
			<div className="fa fa-info-circle" />
			{$t('h5p.text.createAfterFirstSave')}
		</div>;

		const saved = !!this.props.parentId;

		const { contentId, title, contentType } = this.props.content;

		const h5pPreview =
			<div className="card-columns">
				<div className="card">
					<div className="card-block">
						<h4 className="card-title">
							<a href={`/h5p/player/${contentId}?inline=1`} target="_blank">
								{title}
							</a>
						</h4>
						<p className="card-text">{contentType}</p>
					</div>
					<div className="card-footer">
						<a className="btn-edit-h5p" onClick={this.openEditor.bind(this, contentId)} onKeyDown={(e) => {
							if (e.key === 'Enter'){
								this.openEditor.bind(this, contentId);
							}
						}}>
							<i className="fa fa-edit"></i>
						</a>
					</div>
					<input
						type="hidden"
						value={contentId}
						name={`contents[${this.props.position}][content][contentId]`}
					/>
					<input
						type="hidden"
						value={title}
						name={`contents[${this.props.position}][content][title]`}
					/>
					<input
						type="hidden"
						value={contentType}
						name={`contents[${this.props.position}][content][contentType]`}
					/>
				</div>
			</div>;

		return (
			<div>
				{saved || infoBox}
				{contentId && h5pPreview}
				{!contentId &&
					<div>
						<button
							disabled={!saved}
							type="button"
							className="btn btn-secondary btn-add"
							data-testid="topic-h5p-create-btn"
							onClick={this.openEditor.bind(this, contentId)}
							>
							{`+ ${$t('topic.topicEdit.button.h5p')}`}
						</button>
					</div>
				}
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
    $contentBlocksContainer[0],
);
