import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'

import React from 'react'
import ReactDOM from 'react-dom'
import GuildEditor from './GuildEditor'
import registerServiceWorker from './registerServiceWorker'
import PropTypes from 'prop-types'

import './index.css'

import PluginEditor from './plugin-editor'
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromHTML
} from 'draft-js'
import {trimIndent} from './belt'
import {
  getSelectedEntities,
  getSelectedBlockKeys
} from './draft-js-extra'
import makeUndoPlugin from './testplugins/undo-plugin'
import makeCodePlugin from './testplugins/code-plugin'
import makeBlockBreakoutPlugin from './testplugins/block-breakout-plugin'
import makeAutolinkPlugin from './testplugins/autolink-plugin'
import makeInsertBlockPlugin from './testplugins/insert-block-plugin'
import makeCounterPlugin from './testplugins/counter-plugin'
import makeSeedPlugin from './testplugins/seed-plugin'

const undoPlugin = makeUndoPlugin()
const codePlugin = makeCodePlugin()
const blockBreakoutPlugin = makeBlockBreakoutPlugin()
const autolinkPlugin = makeAutolinkPlugin()
const insertBlockPlugin = makeInsertBlockPlugin()
const counterPlugin = makeCounterPlugin()
const seedPlugin = makeSeedPlugin()

const plugins = [
  autolinkPlugin,
  undoPlugin,
  codePlugin,
  blockBreakoutPlugin,
  insertBlockPlugin,
  counterPlugin,
  seedPlugin
]

// Plugin components
const {UndoButton, RedoButton} = undoPlugin
const {InsertBeforeButton, InsertAfterButton} = insertBlockPlugin
const {CharCount, LineCount, BlockCount} = counterPlugin
const {SeedButton1} = seedPlugin

class TestEditor extends React.Component {
  static propTypes = {
    debugBlocks: PropTypes.bool
  }

  constructor (props) {
    super(props)

    const blocksFromHtml = convertFromHTML(trimIndent(`
      <h1>Hello</h1>

      <pre>This is a code block</pre>

      <p>Here is a paragraph tag with google.com url</p>
    `))

    const state = ContentState.createFromBlockArray(
      blocksFromHtml.contentBlocks,
      blocksFromHtml.entityMap
    )

    this.state = {
      // editorState: EditorState.createEmpty()
      editorState: EditorState.createWithContent(state),
      debugBlocks: true
    }
    this.onChange = (editorState) => this.setState({editorState})
  }

  render () {
    const contentState = this.state.editorState.getCurrentContent()
    const jsonString = JSON.stringify(convertToRaw(contentState), null, 2)

    let className = 'TestEditor'
    if (this.state.debugBlocks) {
      className += ' TestEditor-debugBlocks'
    }

    return (
      <div className={className}>
        <UndoButton />
        <RedoButton />
        <InsertBeforeButton />
        <InsertAfterButton />
        <SeedButton1 />
        <TestButton onClick={() => {
          const entities = getSelectedEntities(this.state.editorState)
          console.log(JSON.stringify(entities, null, 2))
        }} />
        <div style={{border: '3px solid black'}}>
          <PluginEditor
            editorState={this.state.editorState}
            onChange={this.onChange}
            plugins={plugins}
            customStyleMap={{STYLE1: { textDecoration: 'underline' }}}
            placeholder='Click and begin typing'
            blockStyleFn={(block) => {
              let className = ''
              if (block.getType() === 'code-block') {
                className += ' scrollable'
              }
              return className
            }}
          />
        </div>
        <div className='EditorFooter'>
          <div className='EditorFooter-Counters'>
            Chars: <CharCount />, Lines: <LineCount />, Blocks: <BlockCount />
          </div>
          <div className='EditorFooter-DebugBox'>
            <label className='form-label'>
              <input
                id='debugBlocks'
                type='checkbox'
                checked={this.state.debugBlocks}
                onChange={(e) => {
                  this.setState((state) => ({ debugBlocks: !state.debugBlocks }))
                }}
              />
              &nbsp; Debug Blocks
              </label>
          </div>
        </div>
        <pre>{jsonString}</pre>
      </div>
    )
  }
}

const TestButton = (props) => {
  const onMouseDown = (e) => {
    e.preventDefault()
    props.onClick()
  }
  return (
    <button onMouseDown={onMouseDown}>
      Test
    </button>
  )
}

// ReactDOM.render(<TestEditor />, document.getElementById('root'))
ReactDOM.render(<GuildEditor />, document.getElementById('root'))
registerServiceWorker()
