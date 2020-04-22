import React from 'react'
import classnames from 'classnames'
import css from '../css/index'
import '../statics/zwicon.css'
import * as refer from '../statics/refer'
import { handlePropagation } from '../methods/assist-functions' // 用于禁用按钮点击。如果使用 button 的 disable 属性实现，会由于点击事件冒泡导致 Toolbar 被隐藏

const ToolButton = (props:any) => {
    const { icon, onClick, disabled = false, text = '' } = props
    return (<button onClick={disabled ? handlePropagation : onClick} className={classnames(css['tool-button-wrapper'], { [css.disabled_style]: disabled })}>
        {icon && <i className={`${icon}`} style={{ display: "inline-block", width: 18, height: 18, fontSize: 14 }} />}
        {text}
    </button>)
}

export default ToolButton

