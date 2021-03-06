
import React from 'react'
import {
  EditorState,
  convertFromRaw,
  CompositeDecorator
} from 'draft-js'
import decorate from 'decorate-component-with-props'

const TokenSpan = (props) => {
  const style = getDecoratedStyle(
    props.contentState.getEntity(props.entityKey).getMutability()
  )
  return (
    <span data-offset-key={props.offsetkey} style={style}>
      {props.children}
    </span>
  )
}

const rawContent = {
  blocks: [
    {
      text: (
        'This is an "immutable" entity: Superman. Deleting any ' +
        'characters will delete the entire entity. Adding characters ' +
        'will remove the entity from the range.'
      ),
      type: 'unstyled',
      entityRanges: [{ offset: 31, length: 8, key: 'first' }]
    },
    {
      text: '',
      type: 'unstyled'
    },
    {
      text: (
        'This is a "mutable" entity: Batman. Characters may be added ' +
        'and removed.'
      ),
      type: 'unstyled',
      entityRanges: [{ offset: 28, length: 6, key: 'second' }]
    },
    {
      text: '',
      type: 'unstyled'
    },
    {
      text: (
        'This is a "segmented" entity: Green Lantern. Deleting any ' +
        'characters will delete the current "segment" from the range. ' +
        'Adding characters will remove the entire entity from the range.'
      ),
      type: 'unstyled',
      entityRanges: [{ offset: 30, length: 13, key: 'third' }]
    }
  ],

  entityMap: {
    first: {
      type: 'TOKEN',
      mutability: 'IMMUTABLE'
    },
    second: {
      type: 'TOKEN',
      mutability: 'MUTABLE'
    },
    third: {
      type: 'TOKEN',
      mutability: 'SEGMENTED'
    }
  }
}

const decorators = [
  {
    strategy: getEntityStrategy('IMMUTABLE'),
    component: TokenSpan
  },
  {
    strategy: getEntityStrategy('MUTABLE'),
    component: TokenSpan
  },
  {
    strategy: getEntityStrategy('SEGMENTED'),
    component: TokenSpan
  }
]

const SeedButton1 = (props) => {
  return (
    <button onMouseDown={(e) => {
      e.preventDefault()
      props.onClick()
    }}
    >
      Seed1
    </button>
  )
}

export default (config = {}) => {
  let getEditorState
  let setEditorState

  return {
    initialize: (init) => {
      getEditorState = init.getEditorState
      setEditorState = init.setEditorState
    },
    decorators,
    SeedButton1: decorate(SeedButton1, {
      onClick: () => setEditorState(EditorState.createWithContent(convertFromRaw(rawContent), new CompositeDecorator(decorators)))
    })
  }
}

function getEntityStrategy (mutability) {
  return function (contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity()
        if (entityKey === null) {
          return false
        }
        return contentState.getEntity(entityKey).getMutability() === mutability
      },
      callback
    )
  }
}

function getDecoratedStyle (mutability) {
  switch (mutability) {
    case 'IMMUTABLE': return styles.immutable
    case 'MUTABLE': return styles.mutable
    case 'SEGMENTED': return styles.segmented
    default: return null
  }
}

const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
    width: 600
  },
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: 'center'
  },
  immutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 0'
  },
  mutable: {
    backgroundColor: 'rgba(204, 204, 255, 1.0)',
    padding: '2px 0'
  },
  segmented: {
    backgroundColor: 'rgba(248, 222, 126, 1.0)',
    padding: '2px 0'
  }
}
