const noopHandler = () => 'not-handled'
const noop = () => {}

export default {
  // array of {strategy, component}
  decorators: [],
  keyBindingFn: noop,
  // cancelable handlers
  handleReturn: noopHandler,
  handleKeyCommand: noopHandler,
  handleBeforeInput: noopHandler,
  handlePastedText: noopHandler,
  handlePastedFiles: noopHandler,
  handleDroppedFiles: noopHandler,
  handleDrop: noopHandler,
  // key handlers
  onEscape: noop,
  onTab: noop,
  onUpArrow: noop,
  onDownArrow: noop,
  // other
  onBlur: noop,
  onFocus: noop,
  // plugin system only
  initialize: noop,
  onChange: noop,
  // presentation
  customStyleMap: {},
  blockRendererFn: noop,
  blockStyleFn: noop,
  customStyleFn: noop
}
