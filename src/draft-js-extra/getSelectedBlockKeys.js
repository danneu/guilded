
// Returns Seq of selected block key strings including selection start and end keys
export default function getSelectedBlockKeys (editorState) {
  const selection = editorState.getSelection()
  const startKey = selection.getStartKey()
  const endKey = selection.getEndKey()
  let sawEndKey = false
  return editorState.getCurrentContent().getBlockMap().keySeq()
    .skipUntil((k) => k === startKey)
    // HACK: I want to include the endKey. Not sure how else to do it.
    .takeWhile((k) => {
      if (sawEndKey) return false
      if (k === endKey) {
        sawEndKey = true
      }
      return true
    })
}
