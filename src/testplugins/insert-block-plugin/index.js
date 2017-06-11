
import React from 'react'
import decorate from 'decorate-component-with-props'
import {
  genKey,
  ContentBlock
} from 'draft-js'
import {insertBlockBefore, insertBlockAfter} from '../../draft-extra/insert-block'

const InsertButton = (props) => {
  const {onClick, children, className} = props
  const onMouseDown = (e) => {
    e.preventDefault()
    onClick()
  }
  return (
    <button className={className} onMouseDown={onMouseDown}>
      {children}
    </button>
  )
}

const InsertBeforeButton = (props) => {
  return (
    <InsertButton {...props} className='InsertBeforeButton'>
      {props.children || <span>Insert Before</span>}
    </InsertButton>
  )
}

const InsertAfterButton = (props) => {
  return (
    <InsertButton {...props} className='InsertAfterButton'>
      {props.children || <span>Insert After</span>}
    </InsertButton>
  )
}

const defaults = {
  genBlock: () => new ContentBlock({ key: genKey(), type: 'unstyled' })
}

// It can be annoying to create a block before/after the
// block you're in with Enter/Esc alone. This plugin
// provides "Insert before" and "Insert after" buttons.
export default (config = {}) => {
  config = Object.assign(defaults, config)

  let getEditorState
  let setEditorState

  return {
    initialize: (init) => {
      getEditorState = init.getEditorState
      setEditorState = init.setEditorState
    },
    InsertBeforeButton: decorate(InsertBeforeButton, {
      onClick: () => setEditorState(insertBlockBefore(getEditorState(), config.genBlock()))
    }),
    InsertAfterButton: decorate(InsertAfterButton, {
      onClick: () => setEditorState(insertBlockAfter(getEditorState(), config.genBlock()))
    })
  }
}
