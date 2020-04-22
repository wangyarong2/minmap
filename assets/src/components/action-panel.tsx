import React, { useEffect, useRef, useState } from 'react'
import * as life from 'react-life-hooks'
import { getStore } from 'edata-store'
import { CompactPicker } from 'react-color'
import { Select, Input, message, Icon, Tooltip, Empty, Popover, Button } from 'antd'
import TaskPanel from './task-panel'
import NotesPanel from './notes-panel'
import CommentPanel from './comment-panel'
import _ from 'lodash'
import classnames from 'classnames'
import { getNodeById, isCurrentNodeReadOnly } from '../methods/node-util'
import css from '../css'
import { unwrapEdata, prefix } from '../methods/util'

const { Search, TextArea } = Input
const { Option } = Select

let actionPanelStyle = {
    width: 60
}

const fontFamily = [{
    ch: '宋体',
    en: 'SimSun'
}, {
    ch: '黑体',
    en: 'SimHei'
}, {
    ch: '微软雅黑',
    en: 'Microsoft Yahei'
}, {
    ch: '微软正黑体',
    en: 'Microsoft JhengHei'
}, {
    ch: '楷体',
    en: 'KaiTi'
}, {
    ch: '新宋体',
    en: 'NSimSun'
}, {
    ch: '仿宋',
    en: 'FangSong'
},
{
    ch: '幼圆',
    en: 'YouYuan'
}, {
    ch: '隶书',
    en: 'LiSu'
}, {
    ch: '华文细黑',
    en: 'STXihei'
}, {
    ch: '华文楷体',
    en: 'STKaiti'
}, {
    ch: '华文宋体',
    en: 'STSong'
}, {
    ch: '华文仿宋',
    en: 'STFangsong'
}, {
    ch: '华文中宋',
    en: 'STZhongsong'
}, {
    ch: '华文彩云',
    en: 'STCaiyun'
}, {
    ch: '华文琥珀',
    en: 'STHupo'
}, {
    ch: '华文新魏',
    en: 'STXinwei'
}, {
    ch: '华文隶书',
    en: 'STLiti'
}, {
    ch: '华文行楷',
    en: 'STXingkai'
}, {
    ch: '方正舒体',
    en: 'FZShuTi'
}, {
    ch: '方正姚体',
    en: 'FZYaoti'
}]

const fontSize = [
    '8px', '9px', '10px', '11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '20px', '24px', '36px', '48px', '56px'
]

const ActionPanel = (props) => {
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    const tab = eStatus.unwrap('tab')
    const [visible, setVisible] = useState(false)
    const [bgColor, setBgColor] = useState('#4D4D4D')
    useEffect(() => {

        return eStatus.watch(e => {
            if (e.path[0] === 'showActionPanel') {
                redraw()
            }

            const prevNodeId = unwrapEdata(e.meta.oldData)
            if (prevNodeId !== (node && node.id)) {
                redraw()
            }


        })
    }, [])

    // 右侧面板折叠
    const toggleActionpanel = () => {
        eStatus.getset('showActionPanel', v => {
            return !v.value
        })
    }

    const handleFontFamily = (value) => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        _.set(node, 'attrs.style.fontFamily', value)
    }

    const handleFontSize = (value) => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        _.set(node, 'attrs.style.fontSize', value)
    }

    const handleTextDecoration = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const textDecoration = _.get(node, 'attrs.style.textDecoration', 'none')
        if (textDecoration !== 'line-through') {
            _.set(node, 'attrs.style.textDecoration', 'line-through')
        } else {
            _.set(node, 'attrs.style.textDecoration', 'none')
        }
    }

    const handleTextDecorationUnderline = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const textDecoration = _.get(node, 'attrs.style.textDecoration', 'none')
        if (textDecoration !== 'underline') {
            _.set(node, 'attrs.style.textDecoration', 'underline')
        } else {
            _.set(node, 'attrs.style.textDecoration', 'none')
        }
    }

    const handleFontWeight = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const fontWeight = _.get(node, 'attrs.style.fontWeight', 'normal')
        if (fontWeight !== 'bold') {
            _.set(node, 'attrs.style.fontWeight', 'bold')
        } else {
            _.set(node, 'attrs.style.fontWeight', 'normal')
        }

    }

    const handleFontStyle = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const fontStyle = _.get(node, 'attrs.style.fontStyle', 'none')
        if (fontStyle !== 'italic') {
            _.set(node, 'attrs.style.fontStyle', 'italic')
        } else {
            _.set(node, 'attrs.style.fontStyle', 'normal')
        }

    }

    // const handleUpperOrLow = () => {
    //     const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
    //     const textTransform = _.get(node, 'attrs.style.textTransform', 'none')
    //     if (textTransform !== 'uppercase') {
    //         _.set(node, 'attrs.style.textTransform', 'uppercase')
    //     } else {
    //         _.set(node, 'attrs.style.textTransform', 'lowercase')
    //     }

    // }

    const handleColor = (value) => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        _.set(node, 'attrs.style.color', value.hex)
        setVisible(false)
        setBgColor(value.hex)
    }

    // 右侧tab切换
    const handleTab = (value) => {
        eStatus.getset('tab', v => {
            if (value === v.value) {
                toggleActionpanel()
            } else {
                eStatus.set('showActionPanel', true)
            }
            return value
        })
    }

    // 外部链接
    const handleLink = (value = '') => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        try {
            const { prefix } = window.CONFIG
            const { origin } = location
            const base = origin + prefix
            const isHashMode = value.startsWith(base + '#/')
            const { hash } = new URL(value, origin)
            const match = /^\#\/mm\/([\w\d-]+)/i.exec(hash)
            if (false && isHashMode && match) {
                const submap = match[1]
                _.set(node, 'attrs.submap.id', submap)
                message.success('已关联子脑图！')
            } else {
                _.set(node, 'attrs.links.link', value)
            }
        } catch (e) { }
    }
    const handleVisibleChange = () => {
        setVisible(true)
    }

    const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
    const { routeParams } = props
    const showActionPanel = !!eStatus.unwrap('showActionPanel')
    const fontFamilyStyle = _.get(node, 'attrs.style.fontFamily', 'Microsoft Yahei')
    const fontSizeStyle = _.get(node, 'attrs.style.fontSize', '14px')
    const linkValue = _.get(node, 'attrs.links.link', '')
    const isRootNode = routeParams.id ? true : node && node.__edata__.closest()
    const isReadOnly = isCurrentNodeReadOnly(node)
    return <div className={css['action-panel-wrapper']} style={{ minWidth: actionPanelStyle.width }}>
        <div className={classnames(css['action-content'], {
            [css.showActionPanel]: showActionPanel
        })}>
            {

                (!node || !isRootNode) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='请先选中节点哦' />
            }
            {
                node && node.id && isRootNode ? <div>
                    {
                        tab === 'style' && <div style={{ padding: '8px 16px' }}>
                            {/* <h5 style={{ margin: 0, padding: '4px 0', textAlign: 'center' }}>样式</h5> */}
                            <div>文字</div>
                            <div className={css['node-action-style']}>
                                <div className={css['node-font-family']}>
                                    <Select onChange={handleFontFamily}
                                         disabled={isReadOnly}
                                        defaultValue={fontFamilyStyle}
                                        style={{ width: '60%' }}
                                    >
                                        {
                                            fontFamily.map((item) => {
                                                return <Option key={item.en} value={item.en}>{item.ch}</Option>
                                            })
                                        }
                                    </Select>
                                    <Select onChange={handleFontSize}
                                        disabled={isReadOnly}
                                        defaultValue={fontSizeStyle}
                                        style={{ width: '35%', marginLeft: '4%' }}
                                    >
                                        {
                                            fontSize.map((item) => {
                                                return <Option key={item} value={item}>{item}</Option>
                                            })
                                        }
                                    </Select>
                                </div>
                                {!isReadOnly && <div className={css['node-font-style']}>
                                    <span onClick={handleFontWeight}>B</span>
                                    <span onClick={handleFontStyle} style={{ fontStyle: 'italic' }}>I</span>
                                    <span onClick={handleTextDecorationUnderline} style={{ textDecoration: 'underline' }}>U</span>
                                    <span onClick={handleTextDecoration} style={{ textDecoration: 'line-through' }}>T</span>
                                    {/* <span onClick={handleUpperOrLow}>M</span> */}
                                    <span>
                                        <Popover
                                            content={<CompactPicker onChange={handleColor} />}
                                            title="颜色"
                                            trigger="click"
                                            visible={visible}
                                            onVisibleChange={handleVisibleChange}
                                        >
                                            <Button disabled={isReadOnly} style={{ padding: 8, height: 15, border: '1px solid #ccc', backgroundColor: bgColor }} />
                                        </Popover>

                                        {/* <input type='color' style={{ width: '20px', height: '15px' }}  /> */}
                                    </span>
                                </div>}
                            </div>
                            {/* <Button type='primary' style={{ marginLeft: '75%' }} onClick={handleSubmitstyle}>确认</Button> */}
                        </div>
                    }
                    {
                        tab === 'task' && <TaskPanel {...props} />
                    }
                    {
                        tab === 'links' && <div style={{ padding: '8px 16px' }}>
                            <p>请添加链接：</p>
                            <Search
                                disabled={isReadOnly}
                                placeholder='请输入链接'
                                enterButton='添加'
                                onSearch={handleLink}
                                defaultValue={linkValue}
                            />
                        </div>
                    }
                    {
                        tab === 'notes' && <NotesPanel {...props} />
                    }
                    {
                        tab === 'comment' && <CommentPanel {...props} />
                    }
                </div> : ''
            }
        </div>
        <div className={css['action-menu']}>
            <span style={{ padding: 8, cursor: 'pointer' }} onClick={toggleActionpanel}>
                {showActionPanel ? <i className='iconfont iconfanhui-copy' /> : <i className='iconfont iconfanhui' />}
            </span>
            <Tooltip placement="left" title='任务'> <span onClick={() => { handleTab('task') }} className={classnames(
                { [css['selected-tab']]: tab === 'task' }
            )}><i className='iconfont iconrenwu' /></span></Tooltip>
            <Tooltip placement="left" title='注释'> <span onClick={() => { handleTab('notes') }} className={classnames(
                { [css['selected-tab']]: tab === 'notes' }
            )}><i className='iconfont iconzhushi' /></span></Tooltip>
            <Tooltip placement="left" title='样式'>  <span onClick={() => { handleTab('style') }} className={classnames(
                { [css['selected-tab']]: tab === 'style' }
            )}><i className='iconfont iconcanshu' /></span></Tooltip>
            <Tooltip placement="left" title='链接'><span onClick={() => { handleTab('links') }} className={classnames(
                { [css['selected-tab']]: tab === 'links' }
            )}><i className='iconfont iconlianjie' /></span></Tooltip>
            <span onClick={() => { handleTab('comment') }} className={classnames(
                { [css['selected-tab']]: tab === 'comment' }
            )}>评论</span>
        </div >
    </div >
}

export default ActionPanel
