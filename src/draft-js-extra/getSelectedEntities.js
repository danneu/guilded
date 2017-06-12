import getSelectedBlockKeys from './getSelectedBlockKeys'
// import I from 'immutable'
import {strlen} from '../belt'

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

  let entityStorageKey = 0
  const entityStorageMap = {}

  let entityRanges

  const temp = {}

  let currKey
  blockKeys.forEach((key) => {
    currKey = key
    const block = blockMap.get(key)
    block.findEntityRanges((character) => {
      return !!character.getEntity()
    }, (startOffset, endOffset) => {
      // const endOffset = startOffset + length
      console.log({startOffset, endOffset})

      const entityKey = entityStorageKey++

      if (currKey === selection.getStartKey()) {
        console.log('in first block of selection', endOffset < selection.getStartOffset())
        if (endOffset < selection.getStartOffset()) {
          return
        }
      }

      if (currKey === selection.getEndKey()) {
        console.log('in last block of selection', startOffset > selection.getEndOffset())
        if (startOffset > selection.getEndOffset()) {
          return
        }
      }

      // Stringify to maintain order of otherwise numeric keys.

      var stringifiedEntityKey = DraftStringKey.stringify(block.getEntityAt(startOffset))

      const info = {
        startOffset,
        endOffset,
        blockKey: currKey,
        entityKey
      }
      temp[stringifiedEntityKey] = info

      if (!entityStorageMap.hasOwnProperty(stringifiedEntityKey)) {
        entityStorageMap[stringifiedEntityKey] = '' + entityKey
      }
    })

    entityRanges = encodeEntityRanges(block, entityStorageMap)
  })

  console.log('entity ranges', JSON.stringify(entityRanges))

  // Flip storage map so that our storage keys map to global
  // DraftEntity keys.
  var entityKeys = Object.keys(entityStorageMap)
  var flippedStorageMap = {}

  const entities = []

  entityKeys.forEach(function (strkey, jj) {
    const entityKey = DraftStringKey.unstringify(strkey)
    var entityRecord = contentState.getEntity(entityKey)
    const entity = {
      type: entityRecord.getType(),
      mutability: entityRecord.getMutability(),
      data: entityRecord.getData(),
      ...temp[strkey]
    }
    entities.push(entity)
    // flippedStorageMap[jj] = entity
  })

  const entityMap = flippedStorageMap
  console.log('entitymapl', JSON.stringify(entityMap))
  console.log('entities', JSON.stringify(entities, null, 2))
  return entities
  // return {
  //   entityMap: flippedStorageMap,
  //   blocks: rawBlocks
  // }
}

/**
 * Convert to UTF-8 character counts for storage.
 */
function encodeEntityRanges (block, storageMap) {
  const encoded = []
  block.findEntityRanges((character) => {
    return !!character.getEntity()
  }, (start, end) => {
    var text = block.getText()
    var key = block.getEntityAt(start)
    encoded.push({
      offset: strlen(text.slice(0, start)),
      length: strlen(text.slice(start, end)),
      // Encode the key as a number for range storage.
      key: Number(storageMap[DraftStringKey.stringify(key)])
    })
  })
  return encoded
}

var DraftStringKey = {
  stringify: function stringify (key) {
    return '_' + String(key)
  },

  unstringify: function unstringify (key) {
    return key.slice(1)
  }
}
