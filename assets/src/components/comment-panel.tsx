import React, { useEffect, useRef, useState, createRef } from 'react'
import * as life from 'react-life-hooks'
import { getStore } from 'edata-store'
// import { CirclePicker } from 'react-color';
import { Avatar, Tooltip, message, Modal, Comment, Form, Button, List, Input } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import { getNodeById, getNodeUsers, getParentNodes } from '../methods/node-util'
import css from '../css'
import { unwrapEdata, getUserInfo, isValidUUIDV4, mergeJSONAPIDataItem, prefix } from '../methods/util'
const { confirm, info } = Modal

const { TextArea } = Input
const CommentPanel = (props) => {
    const { getFieldDecorator, validateFields, setFieldsValue } = props.form
    const [comments, setComments] = useState([])
    const redraw = life.useRedraw()
    const eStatus = getStore('status')
    const rootNode = getStore().proxy()
    const coopStatus = getStore('coop').proxy()
    const userInfo = getUserInfo()
    const isMount = useRef(false)
    const editCommentId = useRef('')
    const isSubmitting = useRef(false)
    const selected_comment = useRef(eStatus.unwrap('selected_comment'))
    const deleteComment = (id) => {
        confirm({
            title: '此节点下所有节点将被更新，确认更新吗?',
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
                if (!node) return
                props.comment.deleteComment(null, {
                    params: { id },
                    query: {
                        rootId: rootNode.id,
                        nodeId: node.id
                    }
                }).then(res => {
                    if (!res.ok) {
                        message.error('删除失败')
                    } else {
                        getCommentList()
                    }
                })
            },
        })
    }

    function getCommentList() {
        const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
        if (!node) {
            return
        }
        return props.comment.getCommentList({
            filterp: {
                xmindmap: rootNode.id
            },
            filter: {
                xnodeId: node.id
            },
            sort: '>createAt',
            page: {
                limit: 999
            }
        }).then(res => {
            if (!isMount.current) { return }
            if (!res.ok) {
                message.error(`获取评论列表失败`)
                return
            }
            if (res.body.errors) {
                message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                return
            }
            setComments(res.body.data.map(v => {
                const item = mergeJSONAPIDataItem(v)
                const date = moment(item.createAt)
                const updateDate = moment(item.date || '')
                const isAuthor = _.get(item, 'xauthor.id') === userInfo.id
                const { xcontent } = item
                const isSelect = selected_comment.current === item.id
                return {
                    id: item.id,
                    comment: item.xcontent,
                    className: isSelect ? css.commentHighlight : '',
                    author: _.get(item, 'xauthor._temp.text'),
                    // avatar: '',
                    content: <p data-id={item.id} ref={ref=>{
                        if(isSelect && ref) {
                            (ref as any).scrollIntoViewIfNeeded(true)
                            selected_comment.current = ''
                        }
                    }}>{xcontent}</p>,
                    datetime: [<Tooltip key={1} title={date.format('YYYY-MM-DD HH:mm:ss')}>
                        <span>{date.fromNow()}</span>&nbsp;
                    </Tooltip>,
                    updateDate.isValid() && <Tooltip key={2} title={updateDate.format('YYYY-MM-DD HH:mm:ss')}>
                        {<span>{'(已编辑)'}</span>}
                    </Tooltip>,
                    ],
                    actions: isAuthor && [
                        // <span onClick={e=>{
                        //     deleteComment(item.id)
                        // }}>删除</span>,
                        <span key={1} onClick={e => {
                            editCommentId.current = item.id
                            setFieldsValue({
                                comment: xcontent
                            })
                            redraw()
                        }}>编辑</span>,
                        <span key={2} onClick={e => {
                            message.info({
                                content: <div>
                                    <TextArea
                                        value={`${location.origin}${location.pathname}?selectId=${node.id}&selectedComment=${item.id}`}
                                        onFocus={e=>{ e.target.select() }}
                                    ></TextArea>
                                    <Button onClick={e=>{
                                        message.destroy()
                                    }}>关闭</Button>
                                </div>,
                                icon: null,
                                duration: 0
                            })
                        }}>分享</span>
                    ]
                }
            }))
        })
    }
    useEffect(() => {
        isMount.current = true
        const unwatch = eStatus.watch(e => {
            if (!isMount.current) { return }
            if (e.path[0] === 'showActionPanel') {
                redraw()
            }
            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            const prevNodeId = unwrapEdata(e.meta.oldData)
            if (prevNodeId !== (node && node.id)) {
                redraw()
            }

        })
        const unwatchCoopStatus = coopStatus.__edata__.watch(e => {
            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            if (/^comment_update\b/.test(e.path.join())) {
                if (coopStatus.comment_update.nodeId === node.id) {
                    getCommentList()
                }
            }
        })
        getCommentList()
        return () => {
            isMount.current = false
            unwatchCoopStatus()
            unwatch()
            eStatus.set('selected_comment', '')
        }
    }, [])

    // 确认
    const handleSubmit = (e) => {
        e.preventDefault()
        validateFields((err, fieldsValue) => {
            const { node } = getNodeById(eStatus.unwrap('cur_select')) || {} as any
            if (err || !node) {
                return
            }
            if (!fieldsValue.comment) {
                return
            }

            if (!isValidUUIDV4(rootNode.id)) {
                return message.info('请先保存脑图后评论')
            }
            const { comment } = fieldsValue

            if(isSubmitting.current) {
                return
            }
            isSubmitting.current = true

            if (editCommentId.current) {
                props.comment.updateComment({
                    data: {
                        attributes: {
                            xcontent: comment
                        }
                    }
                }, {
                    params: {
                        id: editCommentId.current
                    }, query: {
                        rootId: rootNode.id,
                        nodeId: node.id
                    }
                }).then(res => {
                    if (!res.ok) {
                        return message.error('保存评论失败')
                    }
                    editCommentId.current = ''
                    setFieldsValue({
                        comment: ''
                    })
                }).finally(()=>{
                    isSubmitting.current = false
                })
            } else {
                props.comment.createComment({
                    data: {
                        attributes: {
                            xcontent: comment,
                            xauthor: {
                                id: userInfo.id,
                                type: 'form_mindUser'
                            },
                            xmindmap: {
                                id: rootNode.id,
                                type: 'form_mindmap'
                            },
                            xnodeId: node.id
                        }
                    }
                }, {
                    query: {
                        rootId: rootNode.id,
                        nodeId: node.id
                    }
                }).then(res => {
                    if (res.status != 201 || !res.ok) {
                        if (res.body && res.body.errors) {
                            message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                        } else {
                            message.error('提交评论失败')
                        }
                        return
                    }
                    setFieldsValue({
                        comment: ''
                    })
                    const { id } = res.body.data
                    const { comment } = fieldsValue
                    const allUsers = getNodeUsers({node, includeRoot: true})
                    const parentsOfNode = getParentNodes(node)
                    const nodesTextArr = parentsOfNode.reverse().concat(node).map(v=>v.text)
                    // console.log(allUsers, 9899)
                    props.mindmap.sendEmail({
                        to: allUsers.map(v=>v.key),
                        subject: `有新的评论，在脑图：${nodesTextArr.join('/')}`,
                        // text: `评论内容为：${comment}`,
                        html: `由 <b>${userInfo.xusername}</b> <h4>在脑图：${nodesTextArr.join('/')}</h4> <i>评论内容：</i> <div>${comment}</div><br><br><a href="${location.origin}${location.pathname}?selectId=${node.id}&selectedComment=${id}">点击打开脑图查看</a>`,
                    })
                    setComments([...comments, {
                        id,
                        comment,
                        author: userInfo.xusername,
                        // avatar: '',
                        content: <p>{comment}</p>,
                        datetime: <Tooltip title={moment().format('YYYY-MM-DD HH:mm:ss')}>
                            <span>{moment().fromNow()}</span>
                        </Tooltip>,
                        actions: [
                            <span key={1} onClick={e => {
                                editCommentId.current = id
                                setFieldsValue({
                                    comment
                                })
                            }}>编辑</span>,
                            <span key={2} onClick={e => {
                                message.info({
                                    content: <div>
                                        <TextArea
                                            value={`${location.origin}${location.pathname}?selectId=${node.id}&selectedComment=${id}`}
                                            onFocus={e=>{ e.target.select() }}
                                        ></TextArea>
                                        <Button onClick={e=>{
                                            message.destroy()
                                        }}>关闭</Button>
                                    </div>,
                                    icon: null,
                                    duration: 0
                                })
                            }}>分享</span>
                        ]
                    }])
                }).finally(()=>{
                    isSubmitting.current = false
                })
            }
        })
    }

    const CommentList = ({ comments }) => (
        <List
            dataSource={comments}
            header={`${comments.length} ${comments.length > 1 ? '条评论' : '条评论'}`}
            itemLayout="horizontal"
            renderItem={(props: any) => <Comment {...props} />}
        />
    )

    return <div style={{ padding: '16px' }}>
        <div className={css['comment']}>
            {comments.length > 0 && <CommentList comments={comments} />}
        </div>
        <Form onSubmit={handleSubmit}>
            <Form.Item style={{ marginBottom: 0 }}>
                {getFieldDecorator('comment', {
                    rules: [{
                        // required: true,
                        // message: '请输入你的评论!'
                    }],
                })(
                    <TextArea rows={4} placeholder='请输入你的评论' />
                )}
            </Form.Item>
            <Form.Item>
                <Button type='primary' size='small' htmlType='submit'>
                    {editCommentId.current ? '更新' : '评论'}
                </Button>

            </Form.Item>
        </Form>
    </div>
}

export default Form.create()(CommentPanel)
