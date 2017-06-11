
import CodeUtils from 'draft-js-code'
import {
  EditorState,
  Modifier,
  RichUtils
} from 'draft-js'

const createCodePlugin = (config = {}) => {
  const {getEditorState, setEditorState} = config

  const handleKeyCommand = (command) => {
    let newState

    const editorState = getEditorState()

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      newState = CodeUtils.handleKeyCommand(editorState, command)
    }

    if (!newState) {
      newState = RichUtils.handleKeyCommand(editorState, command)
    }

    if (newState) {
      setEditorState(newState)
      return 'handled'
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

  // TODO: I should do this for all blocks really.
  const onUpArrow = (e) => {
    const editorState = getEditorState()
    const selectionState = editorState.getSelection()

    if (!selectionState.isCollapsed()) {
      return 'not-handled'
    }

    const contentState = editorState.getCurrentContent()
    if (selectionState.getStartOffset() === 0 && CodeUtils.hasSelectionInBlock(editorState) && contentState.getFirstBlock().get('key') === selectionState.getStartKey()) {
      let newContentState = Modifier.splitBlock(contentState, selectionState)
      newContentState = Modifier.setBlockType(newContentState, selectionState, 'unstyled')
      setEditorState(EditorState.push(editorState, newContentState, 'split-block'))
      return 'handled'
    }

    return 'not-handled'
  }

  return {
    handleKeyCommand,
    keyBindingFn,
    handleReturn,
    handlePastedText,
    onTab,
    onUpArrow
  }
}

export default createCodePlugin
