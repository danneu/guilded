import getSelectedBlockKeys from './getSelectedBlockKeys'

// const EMPTY_SET = new I.OrderedSet()

// if anyOverlap is true, then entities are considered selected if the selection
// touches them at all instead of fully covering them.
//
// TODO: Overlap
export default function getSelectedEntities (editorState, anyOverlap = false) {
  const contentState = editorState.getCurrentContent()
  const blockKeys = getSelectedBlockKeys(editorState)
  const blockMap = contentState.getBlockMap()
  const selection = editorState.getSelection()

  const entities = []

  blockKeys.forEach((blockKey) => {
    const block = blockMap.get(blockKey)
    block.findEntityRanges((character) => {
      return !!character.getEntity()
    }, (startOffset, endOffset) => {
      // Ignore entities that are in our blocks but we don't overlap
      if (blockKey === selection.getStartKey() && endOffset < selection.getStartOffset()) {
        return
      }
      if (blockKey === selection.getEndKey() && startOffset > selection.getEndOffset()) {
        return
      }

      const entityKey = block.getEntityAt(startOffset)
      const record = contentState.getEntity(entityKey)

      const entity = {
        entityKey,
        type: record.getType(),
        mutability: record.getMutability(),
        data: record.getData(),
        // other info
        startOffset,
        endOffset,
        blockKey
      }

      entities.push(entity)
    })
  })
  return entities
}
