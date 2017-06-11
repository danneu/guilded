import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  CompositeDecorator,
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding
} from 'draft-js'
import noopPlugin from './noop-plugin'

class PluginEditor extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    plugins: PropTypes.array,
    customStyleMap: PropTypes.object,
    placeholder: PropTypes.string,
    textAlignment: PropTypes.oneOf(['left', 'center', 'right']),
    textDirectionality: PropTypes.oneOf(['RTL', 'LTR']),
    readOnly: PropTypes.bool,
    spellCheck: PropTypes.bool,
    stripPastedStyles: PropTypes.bool
  }

  static defaultProps = {
    plugins: [],
    // Plugin customStyleMaps get merged into this
    customStyleMap: {}
  }

  constructor (props) {
    super(props)

    // Whenever the Draft Editor is updating, we first pass the
    // new editor state to each plugin so that they can react to it.
    // Plugins can optionally return a new editor state from their
    // onChange function to update it.
    this.onChange = (newEditorState) => {
      this.plugins.forEach((plugin) => {
        // if plugin's onChange returns nothing, then use prev state
        newEditorState = plugin.onChange(newEditorState) || newEditorState
      })

      this.setState({
        editorState: newEditorState
      })

      props.onChange(newEditorState)
    }

    const getEditorState = () => this.state.editorState

    this.plugins = props.plugins.map((p) => {
      const plugin = Object.assign({}, noopPlugin, p)
      plugin.initialize({
        getEditorState,
        setEditorState: this.onChange
      })
      return plugin
    })

    const decorator = new CompositeDecorator(
      [].concat.apply([], this.plugins.map((plugin) => plugin.decorators))
    )

    this.state = {
      editorState: EditorState.set(props.editorState, { decorator }),
      // Plugins may change this
      readOnly: props.readOnly
    }

    //
    // HOOKS
    //

    this.keyBindingFn = (e) => {
      let command

      command = this.plugins.find((plugin) => plugin.keyBindingFn(e))
      if (command) return command

      return getDefaultKeyBinding(e)
    }

    this.handleReturn = (e) => {
      if (this.plugins.some((plugin) => plugin.handleReturn(e) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    this.handleKeyCommand = (command) => {
      if (this.plugins.some((plugin) => plugin.handleKeyCommand(command) === 'handled')) {
        return 'handled'
      }

      const newEditorState = RichUtils.handleKeyCommand(this.state.editorState, command)
      if (newEditorState) {
        this.onChange(newEditorState)
        return 'handled'
      }

      return 'not-handled'
    }

    this.handlePastedText = (text, html) => {
      if (this.plugins.some((plugin) => plugin.handlePastedText(text, html) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    // Key Handlers

    this.onEscape = (e) => {
      if (this.plugins.some((plugin) => plugin.onEscape(e) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    this.onTab = (e) => {
      if (this.plugins.some((plugin) => plugin.onTab(e) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    this.onUpArrow = (e) => {
      if (this.plugins.some((plugin) => plugin.onUpArrow(e) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    this.onDownArrow = (e) => {
      if (this.plugins.some((plugin) => plugin.onDownArrow(e) === 'handled')) {
        return 'handled'
      }
      return 'not-handled'
    }

    // Properties

    this.customStyleMap = Object.assign(
      {},
      props.customStyleMap,
      ...this.plugins.map((plugin) => plugin.customStyleMap)
    )

    this.blockRendererFn = (contentBlock) => {
      return this.plugins.find((plugin) => plugin.blockRendererFn(contentBlock))
    }

    this.blockStyleFn = (contentBlock) => {
      return this.plugins.find((plugin) => plugin.blockStyleFn(contentBlock))
    }

    this.customStyleFn = (inlineStyle, contentBlock) => {
      return this.plugins.find((plugin) => plugin.customStyleFn(inlineStyle, contentBlock))
    }

    // PROXY METHODS

    ;[
      'focus',
      'blur',
      'setMode',
      'exitCurrentMode',
      'restoreEditorDOM',
      'setClipboard',
      'getClipboard',
      'getEditorKey',
      'update',
      'onDragEnter',
      'onDragLeave'
    ].forEach((method) => {
      this[method] = (...args) => {
        this.refs.editor[method](...args)
      }
    })
  }

  componentDidMount () {
    console.log('mount', this.refs.editor.focus())
  }

  // RENDER

  render () {
    return (
      <Editor
        {...this.props}
        // Draft editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        // Draft presentation options
        placeholder={this.props.placeholder}
        textAlignment={this.props.textAlignment}
        textDirectionality={this.props.textDirectionality}
        blockRendererFn={this.blockRendererFn}
        blockStyleFn={this.blockStyleFn}
        customStyleMap={this.customStyleMap}
        // behavior
        readOnly={this.state.readOnly}
        spellCheck={this.props.spellCheck}
        stripPastedStyles={this.props.stripPastedStyles}
        // TODO: DOM/Accessibility
        // handlers
        keyBindingFn={this.keyBindingFn}
        handleReturn={this.handleReturn}
        handleKeyCommand={this.handleKeyCommand}
        handlePastedText={this.handlePastedText}
        // key handlers
        onEscape={this.onEscape}
        onTab={this.onTab}
        onUpArrow={this.onUpArrow}
        onDownArrow={this.onDownArrow}
        // other
        ref='editor'
      />
    )
  }
}

export default PluginEditor
