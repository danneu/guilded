import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'

import React from 'react'
import ReactDOM from 'react-dom'
import GuildEditor from './GuildEditor'
import registerServiceWorker from './registerServiceWorker'

import './index.css'

import PluginEditor from './plugin-editor'
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromHTML
} from 'draft-js'
import belt from './belt'
import makeStatsPlugin from './testplugins/stats-plugin'
import makeUndoPlugin from './testplugins/undo-plugin'
import makeCodePlugin from './testplugins/code-plugin'
import makeBlockBreakoutPlugin from './testplugins/block-breakout-plugin'
import makeAutolinkPlugin from './testplugins/autolink-plugin'
import makeInsertBlockPlugin from './testplugins/insert-block-plugin'

const statsPlugin = makeStatsPlugin()
const undoPlugin = makeUndoPlugin()
const codePlugin = makeCodePlugin()
const blockBreakoutPlugin = makeBlockBreakoutPlugin()
const autolinkPlugin = makeAutolinkPlugin()
const insertBlockPlugin = makeInsertBlockPlugin()

const plugins = [
  autolinkPlugin,
  statsPlugin,
  undoPlugin,
  codePlugin,
  blockBreakoutPlugin,
  insertBlockPlugin
]

// Plugin components
const {Stats} = statsPlugin
const {UndoButton, RedoButton} = undoPlugin
const {InsertBeforeButton, InsertAfterButton} = insertBlockPlugin

class TestEditor extends React.Component {
  constructor (props) {
    super(props)

    const blocksFromHtml = convertFromHTML(belt.trimIndent(`
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
      editorState: EditorState.createWithContent(state)
    }
    this.onChange = (editorState) => this.setState({editorState})
  }

  render () {
    const contentState = this.state.editorState.getCurrentContent()
    const jsonString = JSON.stringify(convertToRaw(contentState), null, 2)

    return (
      <div>
        <UndoButton />
        <RedoButton />
        <InsertBeforeButton />
        <InsertAfterButton />
        <div style={{border: '3px solid black'}}>
          <PluginEditor
            editorState={this.state.editorState}
            onChange={this.onChange}
            plugins={plugins}
            customStyleMap={{STYLE1: { textDecoration: 'underline' }}}
            placeholder='Click and begin typing'
          />
        </div>
        <Stats />
        <pre>{jsonString}</pre>
      </div>
    )
  }
}

ReactDOM.render(<TestEditor />, document.getElementById('root'))
// ReactDOM.render(<GuildEditor />, document.getElementById('root'))
registerServiceWorker()
