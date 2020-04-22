import React, { useEffect, useRef, useState } from 'react'
import { message, Button } from 'antd'
// 引入编辑器组件
import BraftEditor from 'braft-editor'
import * as life from 'react-life-hooks'
import { getStore } from 'edata-store'
import _ from 'lodash'
import { handlePropagation } from '../methods/assist-functions'
import { getNodeById, isCurrentNodeReadOnly } from '../methods/node-util'


// 引入编辑器样式
import 'braft-editor/dist/index.css'
import { unwrapEdata, getUserInfo } from '../methods/util'


const controls = [
    'undo', 'redo', 'separator',
    'font-size', 'line-height', 'letter-spacing', 'separator',
    'text-color', 'bold', 'italic', 'underline', 'strike-through', 'separator',
    'superscript', 'subscript', 'remove-styles', 'emoji', 'separator', 'text-indent', 'text-align', 'separator',
    'headings', 'list-ul', 'list-ol', 'blockquote', 'code', 'separator',
    'link', 'separator', 'hr', 'separator',
    'media', 'separator',
    'clear', 'fullscreen',
]
const defaulControls = [
    'text-indent', 'text-align',
    'headings', 'list-ul', 'list-ol', 'separator',
    'fullscreen',
]

const NotesPanel = (props) => {
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
    const noteValue = _.get(node, 'attrs.notes.note', '')
    const [editorState, setEditorState] = useState(noteValue)
    const [noteValues, setNoteValues] = useState()
    const [controlConfig, setControlConfig] = useState(defaulControls)
    useEffect(() => {
        const targetNode = document.getElementsByClassName('bf-container')[0]
        const config = { attributes: true, childList: false, subtree: false }
        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    if (mutation.target.className.indexOf('fullscreen') !== -1) {
                        setControlConfig(controls)
                    } else {
                        setControlConfig(defaulControls)
                    }
                }
            }
        }
        const observer = new MutationObserver(callback)
        observer.observe(targetNode, config)

        return eStatus.watch(e => {
            if (e.path[0] === 'showActionPanel') {
                redraw()
            }
            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            if (!node) return
            const prevNodeId = unwrapEdata(e.meta.oldData)
            if (prevNodeId !== (node && node.id)) {
                redraw()
            }
        })
    }, [])

    // 获取值
    const handleContent = (value) => {
        setNoteValues(value)
    }

    // 保存值
    const onSave = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        if (noteValues.toText()) {
            const content = noteValues.toHTML()
            _.set(node, 'attrs.notes.note', content)
        } else {
            _.set(node, 'attrs.notes.note', '')
        }
        _.set(node, 'attrs.updater', getUserInfo())
    }

    const isReadOnly = isCurrentNodeReadOnly(node)

    return <div style={{ position: 'relative' }} id='note-editor'>
        <BraftEditor
            defaultValue={BraftEditor.createEditorState(noteValue)}
            readOnly={editorState || isReadOnly}
            onChange={handleContent}
            placeholder='请输入你的注释'
            controls={controlConfig as any}
            componentBelowControlBar={isReadOnly ? null : editorState ?
                <Button type='primary' style={{ margin: 8, width: 60 }} onClick={() => setEditorState(false)}>编辑</Button> :
                <Button type='primary' style={{ margin: 8, width: 60 }} onClick={onSave}>确认</Button>}
        />
    </div>
}

export default NotesPanel