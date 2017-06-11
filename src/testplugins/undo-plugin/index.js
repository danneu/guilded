import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {EditorState} from 'draft-js'

const editorToProps = (WrappedComponent, xform) => class extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired
  }

  render () {
    return (
      <WrappedComponent {...xform(this.props.editorState)} />
    )
  }
}

const UndoButton = (props) => {
  console.log('undo', props)
  const {undoStackSize, onClick} = props
  return (
    <button className='UndoButton' disabled={undoStackSize === 0} onClick={onClick}>
      Undo
    </button>
  )
}

UndoButton.propTypes = {
  undoStackSize: PropTypes.number.isRequired,
  onClick: PropTypes.func // .isRequired
}

export default (config = {}) => {
  const store = {
    getEditorState: undefined,
    setEditorState: undefined
  }

  return {
    initialize: ({getEditorState, setEditorState}) => {
      console.log('undo button initialize')
      store.getEditorState = getEditorState
      store.setEditorState = setEditorState
    },
    // Components
    UndoButton: editorToProps(UndoButton, (editorState) => ({
      undoStackSize: editorState.getUndoStack().size,
      onClick: () => store.setEditorState(EditorState.undo(store.getEditorState()))
    }))
    // UndoButton: editorToProps(UndoButton, (editorState) => ({
    //   undoStackSize: editorState.getUndoStack().size,
    //   onClick: () => store.setEditorState(EditorState.undo(store.getEditorState()))
    // }))
  }
}
