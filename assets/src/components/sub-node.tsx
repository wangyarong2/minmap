import React, { useEffect, useCallback, useRef } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import Node from './node'
import css from '../css'
import { getStore } from 'edata-store'
import * as life from 'react-life-hooks'
import { getNodeById } from '../methods/node-util'


const SubNode = ({ layer, node, node_refs, parent, on_left, mindmap, routeParams }) => {
    node.meta = node.meta || {}
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    useEffect(() => {
        return eStatus.watch(e => {
            if (e.path[0] === 'cur_select') {
                redraw()
            }
        })
    }, [])

    useEffect(() => {
        return node.__edata__ && node.__edata__.watch(e => {
            if (e.path[0] === 'meta') return
            (e.path.length === 1 || /^children,\d+$/.test(e.path)) && redraw()
        })
    }, [location.href])

    life.onDidUpdate(() => {
        const cur_select = getStore('status').unwrap('cur_select')
        const { ref } = getNodeById(cur_select) || {}
        if (ref && ref.current) {
            ref.current.scrollIntoViewIfNeeded({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
    })
    const submap = _.get(node, 'attrs.submap.id')
    // const shouldShowSubMap = !submap || !routeParams.id && layer < 2
    const shouldShowSubMap = routeParams.id ? true : layer < 2
    return (<div className={classnames(css['sub-node-wrapper'], { [css['left_style']]: on_left })}>
        <Node routeParams={routeParams} mindmap={mindmap} layer={layer} node={node} data-x='oij' node_refs={node_refs} parent={parent} on_left={on_left} />
        <div className={classnames({ [css.hide_children]: node.hideChildren })}>
            {shouldShowSubMap && node.showChildren && node.children && node.children.slice().map(sub_node => sub_node && <SubNode routeParams={routeParams} mindmap={mindmap} key={sub_node.id} layer={layer + 1}
                node={sub_node} node_refs={node_refs}
                parent={node} on_left={on_left} />)}
        </div>

    </div>)
}

export default SubNode