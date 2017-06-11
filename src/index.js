import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'

import React from 'react'
import ReactDOM from 'react-dom'
import GuildEditor from './GuildEditor'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

import './index.css'

import PluginEditor from './PluginEditor'
import {EditorState, convertToRaw} from 'draft-js'
import makeStatsPlugin from './testplugins/stats-plugin'
import makeUndoPlugin from './testplugins/undo-plugin'

const statsPlugin = makeStatsPlugin()
const undoPlugin = makeUndoPlugin()

const plugins = [
  statsPlugin,
  undoPlugin
]

// Plugin components
const {Stats} = statsPlugin
const {UndoButton} = undoPlugin

class TestEditor extends React.Component {
  constructor (props) {
    super(props)

    this.state = { editorState: EditorState.createEmpty() }
    this.onChange = (editorState) => this.setState({editorState})
  }

  render () {
    const contentState = this.state.editorState.getCurrentContent()
    const jsonString = JSON.stringify(convertToRaw(contentState), null, 2)

    return (
      <div>
        <UndoButton editorState={this.state.editorState} />
        <PluginEditor
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={plugins}
        />
        <Stats editorState={this.state.editorState} />
        <pre>{jsonString}</pre>
      </div>
    )
  }
}

// ReactDOM.render(<TestEditor />, document.getElementById('root'))
ReactDOM.render(<GuildEditor />, document.getElementById('root'))
registerServiceWorker()
