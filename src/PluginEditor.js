import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Editor, getDefaultKeyBinding} from 'draft-js'

const noopPlugin = (() => {
  const noopHandler = () => 'not-handled'
  const noop = () => {}
  const identity = (x) => x

  return {
    keyBindingFn: noop,
    // cancelable handlers
    handleReturn: noopHandler,
    handleKeyCommand: noopHandler,
    handleBeforeInput: noopHandler,
    handlePastedText: noopHandler,
    handlePastedFiles: noopHandler,
    handleDroppedFiles: noopHandler,
    handleDrop: noopHandler,
    // key handlers
    onEscape: noop,
    onTab: noop,
    onUpArrow: noop,
    onDownArrow: noop,
    // other
    onBlur: noop,
    onFocus: noop,
    // plugin system only
    initialize: noop,
    onChange: identity
  }
})()

class PluginEditor extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    plugins: PropTypes.array
  }

  static defaultProps = {
    plugins: []
  }

  constructor (props) {
    super(props)

    this.state = {
      editorState: props.editorState
    }

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
      // const plugin = makePlugin({getEditorState, setEditorState: this.onChange})
      const plugin = Object.assign({}, noopPlugin, p)
      plugin.initialize({getEditorState, setEditorState: this.onChange})
      return plugin
    })

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
      return 'not-handled'
    }
  }

  render () {
    return (
      <Editor
        editorState={this.props.editorState}
        onChange={this.onChange}
        // special props
        // handlers
        keyBindingFn={this.keyBindingFn}
        handleReturn={this.handleReturn}
        handleKeyCommand={this.handleKeyCommand}
      />
    )
  }
}

export default PluginEditor
