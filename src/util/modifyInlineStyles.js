
import I from 'immutable'
import {CharacterMetadata} from 'draft-js'

CharacterMetadata.applyStyles = function applyStyle (record, styles) {
  var withStyle = record.set('style', record.getStyle().union(styles))
  return CharacterMetadata.create(withStyle)
}

CharacterMetadata.removeStyles = function removeStyle (record, styles) {
  var withoutStyle = record.set('style', record.getStyle().subtract(styles))
  return CharacterMetadata.create(withoutStyle)
}

// https://github.com/facebook/draft-js/blob/master/src/model/transaction/ContentStateInlineStyle.js
// A version that adds/removes multiple styles in one trip
// Returns ContentState
//
// add: true
// remove: false
export default function modifyInlineStyles (
  contentState, // : ContentState,
  selectionState, // SelectionState,
  inlineStyles, // Array<string>,
  addOrRemove // boolean,
) {
  var blockMap = contentState.getBlockMap()
  var startKey = selectionState.getStartKey()
  var startOffset = selectionState.getStartOffset()
  var endKey = selectionState.getEndKey()
  var endOffset = selectionState.getEndOffset()

  var newBlocks = blockMap
    .skipUntil((_, k) => k === startKey)
    .takeUntil((_, k) => k === endKey)
    .concat(I.Map([[endKey, blockMap.get(endKey)]]))
    .map((block, blockKey) => {
      var sliceStart
      var sliceEnd

      if (startKey === endKey) {
        sliceStart = startOffset
        sliceEnd = endOffset
      } else {
        sliceStart = blockKey === startKey ? startOffset : 0
        sliceEnd = blockKey === endKey ? endOffset : block.getLength()
      }

      var chars = block.getCharacterList()
      var current
      while (sliceStart < sliceEnd) {
        current = chars.get(sliceStart)
        chars = chars.set(
          sliceStart,
          addOrRemove
            ? CharacterMetadata.applyStyles(current, inlineStyles)
            : CharacterMetadata.removeStyles(current, inlineStyles)
        )
        sliceStart++
      }

      return block.set('characterList', chars)
    })

  return contentState.merge({
    blockMap: blockMap.merge(newBlocks),
    selectionBefore: selectionState,
    selectionAfter: selectionState
  })
}
