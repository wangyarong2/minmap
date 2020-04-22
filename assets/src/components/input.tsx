import React, { useEffect, useRef } from 'react'
import { getStore } from 'edata-store'
import css from '../css/index'
import { handlePropagation } from '../methods/assist-functions'
import _ from 'lodash'
import { message } from 'antd'
import { getUserInfo } from '../methods/util'
const InputDiv = ({ node, children }) => {
    const self = useRef<any>()
    const nodeStatus = getStore('status').proxy()
    const handleKeydown = event => {
        switch (event.key.toUpperCase()) {
            case 'ESCAPE':
                self.current.textContent = children
            case 'ENTER':
                self.current.blur()
                handlePropagation(event)
                break
            default:
                break
        }
    }

    const handleBlur = (e) => {
        const {dataset} = e.relatedTarget || {}
        if(dataset && dataset.hasEvent) {
            return
        }
        if(!nodeStatus.new_node) {
            _.set(node, 'attrs.updater', getUserInfo())
            nodeStatus.new_node = ''
        }
        node.text = self.current.textContent
        nodeStatus.cur_edit = ''
    }

    useEffect(() => {
        self.current.focus()
        const selection = document.getSelection()
        selection.selectAllChildren(self.current)
        const inter = setInterval(()=>{
            self.current.scrollIntoViewIfNeeded(true)
        }, 100)
        return ()=>{
            clearInterval(inter)
        }
    }, [])

    return (<div className={css['input-wrapper']} ref={self} contentEditable={true} suppressContentEditableWarning={true}
        onClick={handlePropagation} onKeyDown={handleKeydown} onBlur={handleBlur}>{children}</div>)
}

export default InputDiv
