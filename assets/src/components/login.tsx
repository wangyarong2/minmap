import React, { useEffect, useState, useCallback } from 'react'
import { Form, Input, Button, message, Card, Icon } from 'antd'
import _ from 'lodash'
import css from '../css/index'
import { initStore, getStore } from 'edata-store'
import * as life from 'react-life-hooks'
import { prefix } from '../methods/util'

const formItemLayout = {
    labelCol: {
        xs: { span: 14 },
        sm: { span: 6 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16, offset: 4 },
    },
}


const Login = (props) => {
    const { getFieldDecorator, validateFields } = props.form
    const { history } = props
    useEffect(() => {
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        validateFields((err, fieldsValue) => {
            if (err) {
                return
            }

            props.login.getUserInfo({ ...fieldsValue }, {}).then((res) => {
                const { code, data } = res.body
                if (code === 'SUCCESS') {
                    if (_.isEmpty(data)) {
                        message.error('用户名或密码输入有误！')
                    } else {
                        localStorage.setItem('userinfo', JSON.stringify(data.userInfo))
                        message.success('登录成功！')
                        const fromUrl = _.get(props.location, 'query.from')
                        if (/^(https?:)?\/\//i.test(fromUrl)) {
                            location.replace(fromUrl)
                        } else {
                            history.replace(`${prefix}/`)
                        }
                    }
                } else {
                    message.error('请求失败！')
                }
            })
        })
    }

    return <div className={css['login']}>
        <div className={css['login-form-box']}>
            <Card style={{ height: '100%', borderRadius: 8 }} bordered={false}>
                <div style={{ textAlign: 'center', marginTop: '14%', marginBottom: '6%' }}>
                    <img style={{ width: 40, height: 40, marginRight: 16, marginBottom: 8 }} src={`${prefix}/assets/static/img/favicon-32x32.png`} alt='logo' />
                    <span style={{ fontSize: 24 }}>项目管理平台</span>
                </div>
                <Form onSubmit={handleSubmit} {...formItemLayout} className={css['login-form']}>
                    <Form.Item style={{ marginBottom: '6%' }}>
                        {getFieldDecorator('username', {
                            rules: [{
                                required: true,
                                message: '请输入用户名!',

                            }],
                        })(<Input
                            size='large'
                            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="请输入用户名"
                        />)}
                    </Form.Item>
                    <Form.Item style={{ marginBottom: '10%' }}>
                        {getFieldDecorator('password', {
                            rules: [{
                                required: true,
                                message: '请输入密码!',

                            }],
                        })(<Input
                            size='large'
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            type="password"
                            placeholder="请输入密码"
                        />)}
                    </Form.Item>
                    <Form.Item>
                        <Button size='large' style={{ width: '100%' }} type="primary" htmlType="submit" className="login-form-button">
                            登录
                     </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    </div>
}

export default Form.create()(Login)
