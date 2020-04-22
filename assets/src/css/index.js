import _ from 'lodash'
import cssobj from 'cssobj'
import flexbox from 'cssobj-plugin-flexbox'
import defaultUnit from 'cssobj-plugin-default-unit'

// import resetCSS from './minireset.css.js'
import resetCSS from './normalize.css.js'
import layoutCSS from './layout.less.js'
import layoutMerge from './layout'

import {getTheme, eSetting} from '../statics/setting'

cssobj(resetCSS.obj)

const css = cssobj(_.merge(layoutCSS.obj, layoutMerge(getTheme())), {
  local: true,
  plugins: [flexbox(), defaultUnit()]
})
window.css = css

eSetting.watch(e=>{
  _.merge(css.obj, layoutMerge(getTheme()))
  console.log(css.obj)
  css.update()
})

for(let i in layoutCSS.classes) {
  layoutCSS.classes[i] = css.mapClass(layoutCSS.classes[i])
}

console.log(layoutCSS)
const layoutClasses = layoutCSS.classes
export default layoutClasses

