import React, { useEffect } from 'react'
import * as life from 'react-life-hooks'
import {getStore} from 'edata-store'
export default props => {
    const {node} = props
    const redraw = life.useRedraw()
    // getStore().watch(node.__edata__.path, redraw)
    // node.$watch(redraw)
    node.__edata__.watch(redraw)
    // node.__edata__.cut().observer.map(redraw)
    return <li onClick={e=>{
        node.text = Date.now().toString()
        // redraw()
    }}>- {node.text}</li>
}
