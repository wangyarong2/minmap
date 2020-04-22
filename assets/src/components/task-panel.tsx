import React, { useEffect, useRef, useState, createRef } from 'react'
import * as life from 'react-life-hooks'
import { getStore } from 'edata-store'
// import { CirclePicker } from 'react-color';
import { DatePicker, InputNumber, Radio, Form, Button, Icon, Select, Modal, Tooltip, Badge, Input, Drawer } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import { getNodeById, closest, getClosestAuthor, orderChildrenListLevel, orderChildrenListNumber, DEFAULT_TIME_UNIT, isCurrentNodeReadOnly, getNodeUsers, getParentNodes } from '../methods/node-util'
import css from '../css'
import { unwrapEdata, getUserInfo } from '../methods/util'
import { NODE_TASK_STATUS } from '../methods/node-util'
import useTimeout from '@rooks/use-timeout';

import { Z_STREAM_END } from 'zlib'

const { Option } = Select

const dateFormat = 'YYYY-MM-DD'
const dateFormatM = 'MM-DD'

const TaskPanel = (props) => {
    const { getFieldDecorator, validateFieldsAndScroll, getFieldValue, setFieldsValue } = props.form
    const { routeParams } = props
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    const rootNode = getStore().proxy()
    const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
    const finishedStatus = _.get(node, 'attrs.tasks.status') // , 'NOSTART'
    const [formatStart, setFormatStart] = useState(dateFormatM)
    const [formatEnd, setFormatEnd] = useState(dateFormatM)
    const [memberList, setMemberList] = useState([])
    const [status, setStatus] = useState(finishedStatus)
    const [tick, setTick] = useState(Date.now())
    const userInfo = getUserInfo()

    useEffect(() => {
        let isMount = true
        props.login.getMemberList().then(res => {

            if (res.body.data) {
                const data = res.body.data.memberList
                isMount && setMemberList(data)
            }
        })
        const unwatch = eStatus.watch(e => {
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

        return () => {
            isMount = false
            unwatch()
        }
    }, [])

    const prevTasksValue = _.get(node, 'attrs.tasks', {})
    const tasksValueCache = useRef(_.omit(unwrapEdata(prevTasksValue), ['startValue', 'okTime']))
    const tasksDiff = useRef({})
    const isReadOnly = isCurrentNodeReadOnly(node)
    // 确认
    const handleSubmit = e => {
        if(isReadOnly) return
        e && e.preventDefault()
        validateFieldsAndScroll((err, fieldsValue) => {
            if (err) {
                return
            }

            let { startValue, endValue, director, tester, copyPerson, status, level, tag } = fieldsValue

            // copyPerson = copyPerson || []

            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            if(!node) {
                return
            }
            if(director) {
                director.meta = {nodeId: node.id}
            }

            if(tester) {
                tester.meta = {nodeId: node.id}
            }

            const prevStatus = _.get(node, 'attrs.tasks.status')
            const endTime = endValue ? endValue.valueOf() : undefined

            if(endTime !== undefined || status) {
                _.set(node, 'attrs.tasks.startValue', startValue ? startValue.valueOf() : '')
            }
            if(endTime !== undefined || tasksValueCache.current.endValue) {
                _.set(node, 'attrs.tasks.endValue', endTime)
            }
            if(prevStatus != status) {
                _.set(node, 'attrs.tasks.status', status)
                if(status === 'FINISHED') {
                    _.set(node, 'attrs.tasks.okTime', moment().valueOf())
                }
                const allUsers = getNodeUsers({node, includeRoot: true})
                const parentsOfNode = getParentNodes(node)
                const nodesTextArr = parentsOfNode.reverse().concat(node).map(v=>v.text)
                props.mindmap.sendEmail({
                    to: allUsers.map(v=>v.key),
                    subject: `任务状态更新，在脑图：${nodesTextArr.join('/')}`,
                    // text: `评论内容为：${comment}`,
                    html: `由 <b>${userInfo.xusername}</b> 更新了 <h4>脑图：${nodesTextArr.join('/')}</h4> <h4>任务状态：${NODE_TASK_STATUS[status]}</h4> <div><br><br><a href="${location.origin}${location.pathname}?selectId=${node.id}">点击打开脑图查看</a></div>`,
                })
            }
            if(director !== undefined || tasksValueCache.current.director) {
                _.set(node, 'attrs.tasks.director', director)
            }
            if(tester !== undefined || tasksValueCache.current.tester) {
                _.set(node, 'attrs.tasks.tester', tester)
            }
            if(Array.isArray(copyPerson)) {
                _.set(node, 'attrs.tasks.copyPerson', copyPerson.map(v=>{
                    return {
                        ...v,
                        meta: {nodeId: node.id}
                    }
                }))
            }
            level && _.set(node, 'attrs.tasks.level', level)
            tag!=null && _.set(node, 'attrs.tasks.tag', tag)

            const currentTasksValue = _.omit(unwrapEdata(_.get(node, 'attrs.tasks')), ['startValue', 'okTime'])
            if(JSON.stringify(currentTasksValue) !== JSON.stringify(tasksValueCache.current)) {
                // console.log(currentTasksValue, tasksValueCache.current)
                tasksValueCache.current = currentTasksValue
                _.set(node, 'attrs.updater', getUserInfo())
            }

            if (level) {
                /** BUG: only first state change ok */
                // orderChildrenListLevel(node)
            }
        })
    }

    const autoSubmit= () => {
        setTick(Date.now())
    }

    useEffect(()=>{
        handleSubmit(null)
    }, [status, tick])

    // 清除
    const handleClearTasks = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        _.set(node, 'attrs.tasks', {})
        setFieldsValue({
            endValue: undefined,
            startValue: undefined,
            status: undefined,
            level: undefined,
            director: undefined,
            tag: undefined
        })
    }

    // 禁选日期
    const disabledStartDate = startValue => {
        const endValue = getFieldValue('endValue')

        if (!startValue || !endValue) {
            return false
        }
        return startValue.valueOf() > endValue.valueOf()
    }

    // 禁选日期
    const disabledEndDate = endValue => {
        const startValue = getFieldValue('startValue')
        if (!endValue || !startValue) {
            return false
        }
        return endValue.valueOf() <= startValue.valueOf()
    }

    // 开始日期格式设置
    const handleChangeDateStart = (date) => {
        const start = moment().startOf('year').valueOf()
        const end = moment().endOf('year').valueOf()
        if (date && date.valueOf() >= start && date.valueOf() <= end) {
            setFormatStart(dateFormatM)
        } else {
            setFormatStart(dateFormat)
        }
        autoSubmit()
    }


    // 结束日期格式设置
    const handleChangeDateEnd = (date) => {
        const start = moment().startOf('year').valueOf()
        const end = moment().endOf('year').valueOf()
        if (date && date.valueOf() >= start && date.valueOf() <= end) {
            setFormatEnd(dateFormatM)
        } else {
            setFormatEnd(dateFormat)
        }
        autoSubmit()
    }

    // 右侧面板顶部父级日期显示
    const getParentTime = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const nodeData = node.__edata__
        const parentData = closest(nodeData)
        const endValue = _.get(parentData, 'attrs.tasks.endValue')
        if (endValue) {
            return moment(+endValue).format(dateFormat)
        }
        return '暂无'
    }

    //  同步父级状态
    const handleParentsStatus = () => {
        const action = () => {
            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            const nodeData = node.__edata__
            const parentData = closest(nodeData)
            const parentEndValue = _.get(parentData, 'attrs.tasks.endValue')
            const startValue = _.get(node, 'attrs.tasks.startValue')
            const endValue = _.get(node, 'attrs.tasks.endValue')
            const finishedStatus = _.get(node, 'attrs.tasks.status')
            _.set(parentData, 'attrs.tasks.status', finishedStatus)
            // if (parentEndValue <= endValue || !parentEndValue) {
            _.set(parentData, 'attrs.tasks.startValue', startValue)
            _.set(parentData, 'attrs.tasks.endValue', endValue)
            // }
        }
        Modal.confirm({
            title: '父级时间将被同步覆盖，是否确认?',
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                action()
            },
        })
    }

    const handleParentsEndTime = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const nodeData = node.__edata__
        const parentData = closest(nodeData)
        const parentEndValue = _.get(parentData, 'attrs.tasks.endValue')
        const value = moment(+parentEndValue)
        setFieldsValue({
            endValue: value
        }, handleSubmit)
    }

    const handlAuthorRequire = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        const isTaskOnGoing = status === 'ONGOING'
        return node.__edata__.path.length === 0
            || isTaskOnGoing && !getClosestAuthor(node)
    }

    const handleNotifyPerson = () => {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        if(!node) return
        const allUsers = getNodeUsers({node, includeRoot: true})
        const parentsOfNode = getParentNodes(node)
        const nodesTextArr = parentsOfNode.reverse().concat(node).map(v=>v.text)
        // console.log(allUsers, 9899)
        props.mindmap.sendEmail({
            to: allUsers.map(v=>v.key),
            subject: `任务状态更新，在脑图：${nodesTextArr.join('/')}`,
            // text: `评论内容为：${comment}`,
            html: `由 <b>${userInfo.xusername}</b> 更新了节点任务状态: <h4>脑图路径：${nodesTextArr.join('/')}</h4> <div><br><br><a href="${location.origin}${location.pathname}?selectId=${node.id}">点击打开脑图查看</a></div>`,
        })
    }

    const startValue = _.get(node, 'attrs.tasks.startValue', '')
    const endValue = _.get(node, 'attrs.tasks.endValue', '')
    const finshedStatus = _.get(node, 'attrs.tasks.status') // , 'NOSTART'
    const tag = _.get(node, 'attrs.tasks.tag');
    const level = _.get(node, 'attrs.tasks.level')
    const defaultStart = startValue ? moment(+(startValue)) : moment(new Date(), dateFormatM)
    const defaultEnd = endValue ? moment(+(endValue)) : undefined
    const tester = _.get(node, 'attrs.tasks.tester', undefined)
    const director = _.get(node, 'attrs.tasks.director', undefined)
    const spendTime = _.get(node, 'attrs.tasks.spendTime', undefined)
    const timeUnit = _.get(node, 'attrs.tasks.timeUnit')
    const copyPerson = _.get(node, 'attrs.tasks.copyPerson')
    const creator = _.get(node, 'attrs.creator.xusername')
    const updater = _.get(node, 'attrs.updater.xusername')
    const isParent = closest(node.__edata__)
    return <div style={{ padding: '16px' }}>
        {creator && <div>创建人：{creator}</div>}
        {updater && <div>更新人：{updater}</div>}
        <Form onSubmit={handleSubmit}>
            <p>父级日期 : {getParentTime()}
                {isParent && !isReadOnly &&
                    <Tooltip title='把当前节点时间同步到父级'>
                        <Icon style={{ marginLeft: 16 }} onClick={handleParentsStatus} type='retweet' />
                    </Tooltip>
                }
            </p>

            <Form.Item label='负责人' style={{ width: 170 }}>
                {getFieldDecorator('director', {
                    initialValue: director,
                    rules: [{
                        required: handlAuthorRequire(),
                        message: '请选择负责人!',
                    }],
                })(<Select
                    disabled={isReadOnly}
                    placeholder='请选择负责人'
                    allowClear
                    onChange={autoSubmit}
                    labelInValue
                >
                    {
                        memberList.length > 0 && memberList.map((item) => {
                            return <Option key={item.id} value={item.id}>{item.xusername || (item.attributes && item.attributes.xusername)}</Option>
                        })
                    }
                </Select>)}
            </Form.Item>
            <Form.Item label='验证人' style={{ width: 170 }}>
                {getFieldDecorator('tester', {
                    initialValue: tester,
                    rules: [{
                        required: false,
                        message: '请选择验证人!',
                    }],
                })(<Select
                    disabled={isReadOnly}
                    placeholder='请选择验证人'
                    allowClear
                    onChange={autoSubmit}
                    labelInValue
                >
                    {
                        memberList.length > 0 && memberList.map((item) => {
                            return <Option key={item.id} value={item.id}>{item.xusername || (item.attributes && item.attributes.xusername)}</Option>
                        })
                    }
                </Select>)}
            </Form.Item>
            <Form.Item label='抄送人'>
                {getFieldDecorator('copyPerson', {
                    initialValue: copyPerson,
                    rules: [{
                        required: false,
                        message: '请选择抄送人!',
                    }],
                })(<Select
                    allowClear
                    disabled={isReadOnly}
                    labelInValue
                    onChange={autoSubmit}
                    mode="multiple">
                    {
                        memberList.length > 0 ? memberList
                        // .filter(v=>v.id != userInfo.id)
                        .map((item) => {
                            return <Option key={item.id} value={item.id}>{item.xusername || (item.attributes && item.attributes.xusername)}</Option>
                        }) : []
                    }
                    </Select>)}
            </Form.Item>
            <Form.Item label='请设置开始日期：'>
                {getFieldDecorator('startValue', {
                    initialValue: defaultStart,
                    rules: [{
                        required: status === 'ONGOING',
                        message: '请选择时间!',

                    }],
                })(<DatePicker disabled={isReadOnly} disabledDate={disabledStartDate} format={formatStart} onChange={handleChangeDateStart} />)}
            </Form.Item>
            <Form.Item colon={false} label={<span>请设置结束日期：
                {isParent && !isReadOnly &&
                    <Tooltip title='把父级时间同步到当前节点结束日期'>
                        <Icon onClick={handleParentsEndTime} type='retweet' />
                    </Tooltip>
                }
            </span>}
            >
                {getFieldDecorator('endValue', {
                    initialValue: defaultEnd,
                    rules: [{
                        required: status === 'ONGOING',
                        message: '请选择时间!'
                    },
                    ],
                })(<DatePicker disabled={isReadOnly} disabledDate={disabledEndDate} format={formatEnd} onChange={handleChangeDateEnd} />)}
            </Form.Item>
            <Form.Item label={<span>工时预估</span>}>
                <div className={css.flex}>
                    <InputNumber disabled={isReadOnly} style={{flex: 1}} value={spendTime} min={1} onChange={(value) => {
                        if(isCurrentNodeReadOnly(node)) return
                        _.set(node, 'attrs.tasks.spendTime', value)
                        if(!timeUnit) {
                            _.set(node, 'attrs.tasks.timeUnit', DEFAULT_TIME_UNIT)
                        }
                        redraw()
                    }} />
                    <Select disabled={isReadOnly} style={{width: 80}} value={timeUnit || DEFAULT_TIME_UNIT} onChange={value=>{
                        if(isCurrentNodeReadOnly(node)) return
                        _.set(node, 'attrs.tasks.timeUnit', value)
                        redraw()
                    }}>
                        <Option value='h'>小时</Option>
                        <Option value='d'>天</Option>
                        <Option value='w'>周</Option>
                        <Option value='m'>月</Option>
                    </Select>
                </div>
            </Form.Item>
            <Form.Item label='请选择完成状态：'>
                {getFieldDecorator('status', {
                    initialValue: finshedStatus,
                    rules: [{
                        // required: true,
                        message: '请设置状态!'
                    }],
                })(
                    <Radio.Group
                        disabled={isReadOnly}
                        onChange={(e) => { setStatus(e.target.value) }}
                    >
                        <Radio value='NOSTART'>未开始</Radio>
                        <Radio value='ONGOING'>进行中</Radio>
                        <Radio value='FINISHED'>已完成</Radio>
                    </Radio.Group>
                )}
            </Form.Item>
            <Form.Item label='请选择任务优先级：'>
                {getFieldDecorator('level', {
                    initialValue: level,
                })(
                    <Radio.Group
                    disabled={isReadOnly}
                    onChange={autoSubmit}
                    >
                        <Radio value='LOW'> <Badge color="#87d068" text="低" /></Radio>
                        <Radio value='MIDDLE'><Badge color="orange" text="中" /></Radio>
                        <Radio value='HIGH'><Badge color="red" text="高" /></Radio>
                    </Radio.Group>
                )}
            </Form.Item>
            <Form.Item label='添加标签：'>
                {getFieldDecorator('tag', {
                    initialValue: tag,
                })(
                    <Input disabled={isReadOnly} placeholder="输入标签"
                    onChange={autoSubmit}
                     />,
                )}
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
                <Button disabled={isReadOnly} type='primary' style={{ marginRight: '16px' }} onClick={handleNotifyPerson}>
                    通知相关人
                </Button>
                <Button disabled={isReadOnly} type='default' style={{ marginRight: '16px' }} onClick={handleClearTasks}>
                    清除任务状态
                </Button>
                {/* <Button type='primary' htmlType='submit'>
                    确认
                </Button> */}
            </Form.Item>
        </Form>
    </div>
}

export default Form.create()(TaskPanel)
