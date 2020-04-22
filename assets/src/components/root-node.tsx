import React, { useEffect, forwardRef, useImperativeHandle } from 'react'
import Node from './node'
import { getStore } from 'edata-store'
import css from '../css/index'
import { ROOT_PARENT } from '../statics/refer'
import SubNode from './sub-node'
import * as life from 'react-life-hooks'
import { centerNode, mindMapStyle } from '../methods/node-util'

const RootNode = ({ mindmap, routeParams, layer, node, node_refs }, ref) => {
    node.meta = node.meta || {}
    const root_node = React.useRef()
    const self = React.useRef()
    useImperativeHandle(ref, () => ({
        get rootRef() {
            return self.current
        }
    }))
    const redraw = life.useRedraw()
    const halfValue = routeParams.id ? 3 : 1
    const total = node.children.length,
        half = total > halfValue ? Math.trunc(total / 2) : total
    useEffect(() => {
        setTimeout(() => {
            mindMapStyle.transform = {
                scale: 1,
                translateX: 0,
                translateY: 0
            }
            centerNode(null, null, true)
        })
        const unwatchNode = node.__edata__.watch(e => {
            if (e.path[0] === 'meta') return
            (e.path.length === 1 || /^children,\d+$/.test(e.path) || e.path[0]==='attrs') && redraw()
        })
        const unwatchStatus = getStore('status').watch(e => {
            if (/^quickAddMode$/.test(e.path.join())) {
                redraw()
            }
        })
        document.title = node.text
        return ()=>{
            unwatchNode()
            unwatchStatus()
        }
    }, [location.href])
    // console.log(node, 'root-node')
    const leftNodes = node.showChildren && node.children.slice(half).map((sub_node, i) => <SubNode
        mindmap={mindmap}
        routeParams={routeParams}
        key={sub_node.id}
        layer={layer + 1}
        node={sub_node}
        node_refs={node_refs}
        parent={node} on_left={true} />)
    return (<div className={css['root-node-wrapper']} ref={self}>
        <div>
            {leftNodes}
        </div>
        <div ref={root_node}>
            <Node mindmap={mindmap} routeParams={routeParams} layer={0} node={node} node_refs={node_refs} parent={ROOT_PARENT} />
        </div>
        <div>
            {node.showChildren && node.children.slice(0, half).map((sub_node, i) => <SubNode
                routeParams={routeParams}
                mindmap={mindmap}
                key={sub_node.id || i}
                layer={layer + 1}
                node={sub_node}
                node_refs={node_refs}
                parent={node}
                on_left={false} />)}
        </div>
    </div>)
}

export default forwardRef(RootNode)
