import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'

import React from 'react'
import ReactDOM from 'react-dom'
import GuildEditor from './GuildEditor'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

import './index.css'

ReactDOM.render(<GuildEditor />, document.getElementById('root'))
registerServiceWorker()
