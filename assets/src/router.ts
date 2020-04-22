import App from './components/app'
import Login from './components/login'
import { prefix } from './methods/util'

export default [
    {
        path: `${prefix}/login`,
        component: Login,
        api: ['login']
    },
    {
        path: `${prefix}/mm/:id`,
        component: App,
        api: ['mindmap', 'login', 'comment']
    },
    // {
    //     path: `${prefix}/all`,
    //     component: App,
    //     api: ['mindmap', 'login'],
    // },
    {
        path: `${prefix}/`,
        component: App,
        api: ['mindmap', 'login', 'comment'],
        onChange: e => {
        }
    },
]
