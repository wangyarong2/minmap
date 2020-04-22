import React from 'react'
import {getStore} from 'edata-store'
import Li from './li'
import * as life from 'react-life-hooks'

export default (props) => {
    const root_node = getStore()
    ;(window as any).n = root_node
    const p = root_node.proxy()
    life.onDidRender(()=>{
        console.log('ul render')
    })
    return (
        <ul>
            <Li node={p}></Li>
            {
                p.children.slice().map(
                    node => <Li  key={node.id} node={node}></Li>
                )
            }
        </ul>
    )
}
