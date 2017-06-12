
import Store from '../store'
import React from 'react'

const CharCount = (props) => {
  return <span className='CharCount'>{props.charCount}</span>
}

const LineCount = (props) => {
  return (<span className='LineCount'> {props.lineCount} </span>)
}

const BlockCount = (props) => {
  return (<span className='BlockCount'> {props.blockCount} </span>)
}

export default (config = {}) => {
  const store = new Store({
    charCount: 0,
    lineCount: 0,
    blockCount: 0
  })

  return {
    onChange (editorState) {
      store.setState({
        charCount: countChars(editorState),
        lineCount: countLines(editorState),
        blockCount: countBlocks(editorState)
      })
    },
    CharCount: store.withSubs(CharCount, ['charCount']),
    LineCount: store.withSubs(LineCount, ['lineCount']),
    BlockCount: store.withSubs(BlockCount, ['blockCount'])
  }
}

const newlineRegex = /\r\n|\r|\n/g

function countChars (editorState) {
  const text = editorState.getCurrentContent().getPlainText('')
  return text.replace(newlineRegex, '').trim().length
}

function countLines (editorState) {
  const text = editorState.getCurrentContent().getPlainText('')
  return (text.replace(/\r/g, '').replace(/\n{2,}/g, '').trim().match(/\n/g) || []).length + 1
}

function countBlocks (editorState) {
  return editorState.getCurrentContent().getBlockMap().size
}
