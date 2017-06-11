
import CodeUtils from 'draft-js-code'
import {
  EditorState,
  Modifier
} from 'draft-js'

export default (config = {}) => {
  let getEditorState
  let setEditorState

  const handleKeyCommand = (command) => {
    let newState

    const editorState = getEditorState()

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      const newEditorState = CodeUtils.handleKeyCommand(editorState, command)
      if (newEditorState) {
        setEditorState(newState)
        return 'handled'
      }
    }

    return 'not-handled'
  }

  const keyBindingFn = (e) => {
    const editorState = getEditorState()
    let command

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      command = CodeUtils.getKeyBinding(e)
    }

    return command
  }

  const handleReturn = (e) => {
    const editorState = getEditorState()

    if (!CodeUtils.hasSelectionInBlock(editorState)) {
      return 'not-handled'
    }

    setEditorState(CodeUtils.handleReturn(e, editorState))
    return 'handled'
  }

  const onTab = (e) => {
    const editorState = getEditorState()

    if (!CodeUtils.hasSelectionInBlock(editorState)) {
      return 'not-handled'
    }

    setEditorState(CodeUtils.handleTab(e, editorState))
    return 'handled'
  }

  const handlePastedText = (text, html) => {
    let editorState = getEditorState()

    if (!CodeUtils.hasSelectionInBlock(editorState)) {
      return 'not-handled'
    }

    setEditorState(CodeUtils.handlePastedText(editorState, text, html))
    return 'handled'
  }

  return {
    initialize: (init) => {
      getEditorState = init.getEditorState
      setEditorState = init.setEditorState
    },
    handleKeyCommand,
    keyBindingFn,
    handleReturn,
    handlePastedText,
    onTab
  }
}
