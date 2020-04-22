import React, { useEffect, useRef, useState } from 'react'
import css from '../css/index'
import { handlePropagation } from '../methods/assist-functions'
import ToolButton from './tool-button'
import _ from 'lodash'
import { getStore } from 'edata-store'
import { toggleNode, addChild, addSibling, deleteNode, getNodeById, centerNode, getClosestAuthor, orderChildrenListNumber, handleUndoAction, handleRedoAction, walkTree, selectOtherNode } from '../methods/node-util'
import { useRedraw } from 'react-life-hooks'
import { message, Modal, Input, Checkbox, Row, Col, Button, Tag, Radio, Tooltip, Divider } from 'antd'
import { getAuthor, getUserInfo, isValidUUIDV4, NewID } from '../methods/util'
import { getParentNodes } from '../methods/node-util'
import { saveDataFactory } from './common'
const { TextArea } = Input
const { confirm, info } = Modal
const Toolbar = (props) => {
    const edataStatus = getStore('status')
    const redraw = useRedraw()
    const { layer, node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
    const [textareaValue, setTextareaValue] = useState(node)
    const [visible, setVisible] = useState(false)
    const [checkbox, setCheckbox] = useState(['ROOT_NODE', 'CHILDREN_NODE'])
    const { routeParams } = props
    const [position, setPosition] = useState('children')
    const [brotherPosition, setBrotherPosition] = useState('next')
    const [visibleImport, setVisibleImport] = useState(false)
    const [currentText, setCurrentText] = useState('')
    const [brotherOrChildren, setBrotherOrChildren] = useState('')
    useEffect(() => {
        return edataStatus.watch(e => {
            if (e.path[0] === 'cur_select') {
                redraw()
            }
        })
    }, [])

    const handleAddChild = () => {
        addChild(node)
    }


    const handleAddSibling = () => {
        addSibling(node)
        // parent.children.push({
        //     id: Date.now(),
        //     text: Date.now().toString(),
        //     children: []
        // })
    }

    const handleDeleteNode = () => {
        // const index = parent.children.findIndex(v => v.id === node.id)
        // console.log('index', parent.children, node, index)
        // parent.children.splice(index, 1)
        deleteNode(node, !routeParams.id)
    }

    const handleEditNode = () => {
        edataStatus.set('cur_edit', node.id)
    }

    const handleCenterNode = () => {
        centerNode(node)
    }

    const toggleQuickAddMode = () => {
        eStatus.getset('quickAddMode', v=>!v.value)
        redraw()
    }

    const handleToggleChildren = () => {
        toggleNode(node)
    }

    const parents = getParentNodes(node)
    const readOnly = [node].concat(parents).some(v=>_.get(v, 'attrs.readOnly'))

    // 创建子脑图
    const handleCreateSubNode = () => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        // return console.log(getParentNodes(node))
        const xauthor = getAuthor(node)
        if (!xauthor) {
            return message.error('登录超时')
        }
        const author = getClosestAuthor(node)
        _.set(node, 'attrs.tasks.director', {
            key: xauthor.id,
            label: author ? author.label : getUserInfo().xusername
        })

        const rootId = getStore().unwrap('id')
        if (isValidUUIDV4(rootId)) {
            _.set(node, 'attrs.submap.parent', {
                texts: parents.map(v => v.text),
                rootId,
                nodeId: node.id
            })
        }

        const prevSubMapId = _.get(node, 'attrs.submap.id')
        if(prevSubMapId) {
            props.mindmap.getMindMap(null, { id: prevSubMapId }).then(res => {
                if (res.body.errors) {
                    message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                    return
                }
                const xauthor = getAuthor(node)
                let { xjson, _timestamp } = res.body.data.attributes
                xjson = JSON.parse(xjson)
                const {children, ...toSave} = node
                Object.assign(xjson, toSave)
                console.log('toSave', toSave)
                return props.mindmap.updateMindMapWithQuery({ data: { attributes: { xjson: JSON.stringify(xjson), xauthor } } }, {
                    params: {id: prevSubMapId},
                    query: {
                        toSave
                    }
                }).then((res) => {
                    if (res.body.data) {
                        message.success('更新成功！')
                        saveDataFactory(props)().then(() => {
                            redraw()
                        })
                    } else {
                        message.error('更新失败！')
                    }
                })
            })
        } else {
            const { attributes, ...rest } = node
            _.set(rest, 'attrs.creator', getUserInfo())
            return props.mindmap.createMindMap({ data: { attributes: {
                xjson: JSON.stringify(rest),
                xauthor,
                // xcreator: {
                //     id: getUserInfo().id,
                //     type: 'form_mindUser'
                // }
            } } }).then((res) => {
                if (res.body.data) {
                    const {id} = res.body.data
                    _.set(node, 'attrs.submap.id', id)
                    _.set(node, 'attrs.submap.parent', {
                        texts: parents.map(v => v.text),
                        rootId: id,
                        nodeId: node.id
                    })
                    _.set(node, 'attrs.readOnly', true)
                    _.set(node, 'hideChildren', true)
                    _.set(node, 'showChildren', false)
                    message.success('创建成功！')
                    saveDataFactory(props)().then(() => {
                        redraw()
                    })
                } else {
                    message.error('创建失败！')
                }
            })
        }
    }

    // 更新子脑图
    const handleUpdateSubNode = () => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        const submap = _.get(node, 'attrs.submap.id')
        const xauthor = getAuthor(node)
        if (!xauthor) {
            return message.error('登录超时')
        }

        confirm({
            title: '此节点下所有节点将被更新，确认更新吗?',
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                const { attributes, ...rest } = node
                props.mindmap.updateMindMap({ data: { attributes: { xjson: JSON.stringify(rest), xauthor } } }, { id: submap }).then((res) => {
                    if (res.body.data) {
                        message.success('更新成功！')
                        redraw()
                    } else {
                        message.error('更新失败！')
                    }
                })
            },
        })
    }

    // 取消子脑图
    const handleCancelSubNode = () => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        const prevSubMapId = _.get(node, 'attrs.submap.id')
        props.mindmap.getMindMap(null, { id: prevSubMapId }).then(res => {
            if (res.body.errors) {
                message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                return
            }
            let { xjson } = res.body.data.attributes
            xjson = JSON.parse(xjson)
            Object.assign(node, xjson)
            _.unset(node, 'attrs.submap.id')
            _.unset(node, 'attrs.submap.parent')
            _.unset(node, 'attrs.readOnly')
            _.unset(node, 'hideChildren')
            redraw()
            props.mindmap.deleteMindMap(null, { id: prevSubMapId })
        })
    }
    const handleOrderNode = () => {
        edataStatus.getset('order', (v) => {
            return !v.value
        })

        orderChildrenListNumber(node)
    }
    // 撤销
    const handleUndo = () => {
        handleUndoAction()

    }

    const handleRedo = () => {
        handleRedoAction()

    }

    const handleChangeExport = (value) => {
        setCheckbox(value)
        if (value.length === 0) {
            setTextareaValue('')
        }
        if (value.length === 1 && value[0] === 'ROOT_NODE') {
            const { children, ...rest } = node
            setTextareaValue(rest)
        }
        if (value.length === 1 && value[0] === 'CHILDREN_NODE') {
            setTextareaValue(node.children)
        }

        if (value.length === 2) {
            setTextareaValue(node)
        }

    }

    const renderChildren = () => {
        if (checkbox.length === 2 || (checkbox.length === 1 && checkbox[0] === 'CHILDREN_NODE')) {
            return node && _.isArray(node.children) && node.children.map((item) => item && <span key={item.id} style={{ padding: '0 4px' }}>{item.text}</span>)
        }
    }
    const handleExport = () => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        setVisible(true)
        setTextareaValue(node)
    }

    const importRef = useRef<any>('')
    const openImport = () => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        if (!node) {
            return
        }
        setVisibleImport(true)
        if (importRef.current) {
            importRef.current.value = ''
        }
        setCurrentText(node.text)
        setPosition('children')

    }
    const handleOnChange = (e) => {
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        setPosition(e.target.value);
        if (importRef.current.value) {
            const newNode = JSON.parse(importRef.current.value);
            setBrotherOrChildren(newNode.text)
        }
    }
    const handlePosition = (e) => {
        setBrotherPosition(e.target.value);
    }
    const changeTextarea = () => {
        if (importRef.current.value) {
            const newNode = JSON.parse(importRef.current.value);
            setBrotherOrChildren(newNode.text)
        }
    }
    const handleCancelImport = () => {
        setVisibleImport(false)
    }
    const handleImport = () => {
        if (!importRef.current) {
            return
        }
        const { node } = getNodeById(edataStatus.unwrap('cur_select')) || {} as any
        const newNode = JSON.parse(importRef.current.value)
        const path = node.__edata__.path;
        const mindmap = getStore()
        const leaf = path.slice(-1)
        const tree = path.slice(0, -1)
        walkTree(newNode, {
            callback: node => {
                node.id = NewID()
            }
        })
        console.log(brotherPosition, '999999999999999')
        if (position === 'children') {
            addChild(node, newNode)
        } else if (position === 'brother' && brotherPosition === 'next') {
            // addSibling(node,newNode)
            mindmap.get(tree).splice(Number(leaf[0]) + 1, 0, newNode)
        } else if (position === 'brother' && brotherPosition === 'prev') {
            mindmap.get(tree).splice(Number(leaf), 0, newNode)
        }
        setVisibleImport(false)
    }
    const handleCancel = () => {
        setVisible(false);
        setTextareaValue('');
        setCheckbox(['ROOT_NODE', 'CHILDREN_NODE'])
    }

    const renderModal = () => {
        return <Modal
            title="导出"
            visible={visible}
            onOk={handleCancel}
            onCancel={handleCancel}
            footer={[<Button key="submit" type="primary" onClick={handleCancel}>
                确认
        </Button>]}
        >
            <TextArea style={{ width: '100%', height: '100%' }} readOnly value={textareaValue && JSON.stringify(textareaValue)} onFocus={e => { e.target.select() }}></TextArea>
            <Checkbox.Group value={checkbox} style={{ width: '100%' }} onChange={(value) => { handleChangeExport(value) }}>
                <div style={{ padding: '8px 0px' }}>请选择需要导出的节点：</div>
                <Row>
                    <Col span={8}>
                        <Checkbox value="ROOT_NODE">根节点</Checkbox>
                    </Col>
                    <Col span={8}>
                        <Checkbox value="CHILDREN_NODE">子节点</Checkbox>
                    </Col>
                </Row>
            </Checkbox.Group>
            <Row style={{ margin: '8px  0' }}><Tag color="#108ee9">根节点:</Tag>{checkbox.length === 1 && checkbox[0] === 'CHILDREN_NODE' ? '' : textareaValue && textareaValue.text}</Row>
            <Row><Tag color="#108ee9">子节点:</Tag>{renderChildren()}</Row>

        </Modal>
    }
    let childrenLength = node && node.children ? node.children.length : 0
    const eStatus = getStore('status')
    const toggleOutline = () => {
        eStatus.getset('showOutline', v => {
            return !v.value
        })
        redraw()
    }
    const showOutline = !!eStatus.unwrap('showOutline')
    const submap = _.get(node, 'attrs.submap.id')

    return (
        <div className={css['toolbar-wrapper-nav']} onClick={handlePropagation}>
            {/* <Tooltip title='大纲'> <ToolButton icon={showOutline ? 'iconfont icondagang' : 'iconfont icondagang'} onClick={toggleOutline} /></Tooltip> */}
            {/* <Divider type="vertical" /> */}
            <Tooltip title='撤销'> <ToolButton icon={'iconfont iconxingzhuangjiehe'} onClick={handleUndo} /></Tooltip>
            <Tooltip title='恢复'> <ToolButton icon={'iconfont iconxingzhuangjiehebeifen'} onClick={handleRedo} /></Tooltip>
            <Divider type="vertical" />
            <Tooltip title='添加子节点'> <ToolButton icon={'iconfont icontianjiazijiedian'} disabled={readOnly || !node} onClick={handleAddChild} /></Tooltip>
            <Tooltip title='添加兄弟节点'> <ToolButton icon={'iconfont icontianjiaxiongdijiedian'} onClick={handleAddSibling} disabled={readOnly || !node || layer < 1} /></Tooltip>
            <Tooltip title='删除'> <ToolButton icon={'iconfont iconshanchujiedian'} onClick={handleDeleteNode} disabled={readOnly || !node || layer < 1} /></Tooltip>
            <Divider type="vertical" />
            <Tooltip title='编辑'> <ToolButton icon={'iconfont iconbianji'} onClick={handleEditNode} disabled={readOnly || !node} /></Tooltip>
            <Tooltip title='导出'> <ToolButton icon={'iconfont icondaochu'} onClick={handleExport} disabled={!node && childrenLength > 0} /></Tooltip>
            <Tooltip title='导入'> <ToolButton icon={'iconfont icondaoru'} onClick={openImport} disabled={!node && childrenLength > 0} /></Tooltip>
            <Divider type="vertical" />
            <Tooltip title='显隐子节点'> <ToolButton icon={'iconfont iconyincangzijiedian'} onClick={handleToggleChildren} disabled={layer < 1 || childrenLength === 0} /></Tooltip>
            {routeParams.id && !submap && <Tooltip title={submap ? '更新子脑图' : '创建子脑图'}> <ToolButton icon={'iconfont iconnaotu'} onClick={submap ? handleUpdateSubNode : handleCreateSubNode} disabled={readOnly || !node || layer < 1} /></Tooltip>}
            {routeParams.id && submap && <Tooltip title='取消子脑图'> <ToolButton icon={'iconfont iconshanchujiedian'} onClick={handleCancelSubNode} disabled={!node || layer < 1} /></Tooltip>}
            <Tooltip title='排序'> <ToolButton icon={'iconfont icondaochubeifen'} onClick={handleOrderNode} disabled={!node && childrenLength > 0} /></Tooltip>
            <Tooltip title='居中'> <ToolButton icon={'iconfont iconjuzhongduiqi '} onClick={handleCenterNode} /></Tooltip>
            <Tooltip title='快速添加模式'> <ToolButton icon={''} onClick={toggleQuickAddMode} text={eStatus.unwrap('quickAddMode') ? '显' : '加'} /></Tooltip>


            {renderModal()}
            <Modal
                title="导入"
                visible={visibleImport}
                onOk={handleImport}
                onCancel={handleCancelImport}
            >
                <div>
                    <textarea ref={importRef} style={{ width: '100%', height: '100%' }} defaultValue={''} onChange={changeTextarea}></textarea>
                    <p><span>预览结果：</span></p>
                    <p> <Tag color="#108ee9">当前节点</Tag>{currentText}</p>
                    <p> <Tag color="#108ee9">{position === 'children' ? '子节点' : '兄弟节点'}</Tag>{brotherOrChildren}</p>
                    <Radio.Group onChange={handleOnChange} defaultValue='children'>
                        <Radio value='children'>作为子节点</Radio>
                        <Radio value='brother'>作为兄弟节点</Radio>
                    </Radio.Group>
                    {position === 'brother' && <p style={{ marginTop: '24px' }}>选择兄弟节点的位置:</p>}
                    {position === 'brother' && <Radio.Group onChange={handlePosition} defaultValue='next'>
                        <Radio value='prev'>当前节点上方</Radio>
                        <Radio value='next'>当前节点下方</Radio>
                    </Radio.Group>}
                </div>
            </Modal>
        </div>)
}
export default Toolbar
