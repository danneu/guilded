
import {
  EditorState,
  ContentBlock,
  genKey
} from 'draft-js'

// Inserts a new block before the current block and selects it
export function insertBlockBefore (editorState, newBlock) {
  return injectBlock(true, editorState, newBlock)
}

// Inserts a new block after the current block and selects it
export function insertBlockAfter (editorState, newBlock) {
  return injectBlock(false, editorState, newBlock)
}

const defaultBlock = () => {
  return new ContentBlock({ key: genKey(), type: 'unstyled' })
}

// Returns EditorState
//
// newBlock must be a new ContentBlock instance with a unique key (use Draft.genKey())
//
// Like splitBlock, should only call this if selection is collapsed
function injectBlock (before, editorState, newBlock = defaultBlock()) {
  console.assert(newBlock.getKey())
  console.assert(newBlock.getType())

  const contentState = editorState.getCurrentContent()
  const selection = editorState.getSelection()
  const currentBlock = contentState.getBlockForKey(selection.getEndKey())

  const blockMap = contentState.getBlockMap()

  // Split the blocks
  const blocksBefore = blockMap.toSeq().takeUntil((v) => v === currentBlock)
  const blocksAfter = blockMap.toSeq().skipUntil((v) => v === currentBlock).rest()

  // Inject new block
  const augmentedBlock = before
    ? [[newBlock.getKey(), newBlock], [currentBlock.getKey(), currentBlock]]
    : [[currentBlock.getKey(), currentBlock], [newBlock.getKey(), newBlock]]

  const newBlockMap = blocksBefore.concat(augmentedBlock, blocksAfter).toOrderedMap()

  // Select the new block
  const newContentState = contentState.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: newBlock.getKey(),
      anchorOffset: 0,
      focusKey: newBlock.getKey(),
      focusOffset: 0,
      isBackward: false
    })
  })

  return EditorState.push(editorState, newContentState, 'split-block')
}
