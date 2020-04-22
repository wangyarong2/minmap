import React, { useEffect, useRef, useState } from 'react'
import * as life from 'react-life-hooks'
import { getStore } from 'edata-store'
import classnames from 'classnames'
import { Icon } from 'antd'
import css from '../css'
import { initEditor, getOutlineContent, outlineToTree } from '../methods/cm-util'
import mdrag from 'mdrag'
import { flatNodes, centerNode, node_refs } from '../methods/node-util'
const dragOutline = mdrag()
let outlineStyle = {
    width: 300
}
function Outline(props) {
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    const data = getStore()
    const title = data.unwrap('text')
    const [nextTitle, setTitle] = useState(title)
    const editorDomRef = useRef<HTMLDivElement>()
    const dragDomRef = useRef<HTMLDivElement>()
    const editor = useRef<CodeMirror.Editor>()
    useEffect(() => {
        editor.current = initEditor(editorDomRef.current, getOutlineContent().join('\n'))
        const fn = dragOutline({
            name: 'dragOutline',
            el: dragDomRef.current,
            onmove: function (e, data) {
                dragDomRef.current.parentElement.style.minWidth = outlineStyle.width - data.dx + 'px'
            },
            onend: function (e, data) {
                outlineStyle.width -= data.dx
            }
        })
        return eStatus.watch(e => {
            if (e.path[0] === 'showOutline') {
                redraw()
            }
        })
    }, [])


    const showOutline = !!eStatus.unwrap('showOutline')
    return <div className={classnames(css['outline-wrapper'], {
        [css.showOutline]: showOutline
    })} style={{ minWidth: outlineStyle.width }}>
        <div style={{ display: 'flex', padding: '8px 16px 8px', border: '1px solid #ccc' }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 'bold' }}>大纲</span>
            <span onClick={e => {
                const { line } = editor.current.getDoc().getCursor()
                const children = outlineToTree(editor.current.getValue())

                data.set('text', nextTitle)
                data.set('children', children)
                const focusNode = flatNodes({ children }, { end: line + 1 })[0].pop()
                if (focusNode && focusNode.id) {
                    setTimeout(() => {
                        centerNode(focusNode)
                    })
                }
                redraw()
            }}
            ><Icon type="sync" /></span>
        </div>
        {/* <div style={{ marginTop: 16 }}>主题 :
         <Input style={{ width: '80%' }} defaultValue={nextTitle} onChange={e => {
                setTitle(e.target.value)
            }} />
            <Button style={{ margin: '8px 0 0 8px' }} onClick={e => {
                const { line } = editor.current.getDoc().getCursor()
                const children = outlineToTree(editor.current.getValue())
                data.set('text', nextTitle)
                data.set('children', children)
                const focusNode = flatNodes({ children }, { end: line + 1 })[0].pop()
                if (focusNode && focusNode.id) {
                    setTimeout(() => {
                        centerNode(focusNode)
                    })
                }
                redraw()
            }}
            >更新</Button>
        </div> */}
        <div ref={editorDomRef} className={css['outline-editor']}>
        </div>
        {/* <textarea ref={editorDomRef} className={css['outline-editor']} value={tree.join('\n')}></textarea> */}
        <div ref={dragDomRef} className={css['outline-dragger']}></div>
    </div>
}

export default Outline
