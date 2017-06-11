import React from 'react'
import PropTypes from 'prop-types'
import {EditorState} from 'draft-js'

import Store from '../store'

const UndoButton = (props) => {
  const {undoStackSize: stackSize, onClick, children} = props
  return (
    <button className='UndoButton' disabled={stackSize === 0} onClick={onClick}>
      {children || <span>Undo {stackSize}</span>}
    </button>
  )
}

const RedoButton = (props) => {
  const {redoStackSize: stackSize, onClick, children} = props
  return (
    <button className='RedoButton' disabled={stackSize === 0} onClick={onClick}>
      {children || <span>Redo {stackSize}</span>}
    </button>
  )
}

const commonPropTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node
}

UndoButton.propTypes = {
  undoStackSize: PropTypes.number.isRequired,
  ...commonPropTypes
}

RedoButton.propTypes = {
  redoStackSize: PropTypes.number.isRequired,
  ...commonPropTypes
}

export default (config = {}) => {
  const store = new Store({
    undoStackSize: 0,
    redoStackSize: 0
  })

  let setEditorState
  let getEditorState

  return {
    initialize: (init) => {
      getEditorState = init.getEditorState
      setEditorState = init.setEditorState
    },
    onChange: (editorState) => {
      store.setState({
        undoStackSize: editorState.getUndoStack().size,
        redoStackSize: editorState.getRedoStack().size
      })
    },
    // Properties
    customStyleMap: {
      UNDO_STYLE: { color: 'white' }
    },
    // Components
    UndoButton: store.withSubs(UndoButton, ['undoStackSize'], {
      onClick: () => setEditorState(EditorState.undo(getEditorState()))
    }),
    RedoButton: store.withSubs(RedoButton, ['redoStackSize'], {
      onClick: () => setEditorState(EditorState.redo(getEditorState()))
    })
  }
}
