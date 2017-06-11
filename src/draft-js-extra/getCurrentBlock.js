
export default function getCurrentBlock (editorState, selection = editorState.getSelection()) {
  return editorState.getCurrentContent()
    .getBlockForKey(selection.getStartKey())
}
