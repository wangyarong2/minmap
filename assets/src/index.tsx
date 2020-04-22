import './polyfills'
import * as React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import EdataRouter from 'edata-router'
import router from './router'
// import actionMindMap from './actions/mindmap'
// import actionLogin from './actions/login'
import 'antd/dist/antd.css'
import { pathStartsWith } from './methods/util'

export const app = new EdataRouter({
    ajaxConfig: {
        afterResponse: res => {
            const { pathname } = new URL(res.url)
            if (!res.ok) {
                if (pathStartsWith(pathname, '/jsonapi/form_mindmap')) {
                    alert('读取脑图出错，请检查脑图是否存在或是数据是否完整')
                    throw res
                }
            }
        }
    },
    routeMode: ''
})

function requireAll(r) { 
    r.keys().forEach(m=>{
        app.model(r(m).default)
    })
}
requireAll((require as any).context('./actions/', true, /\.ts$/))
// app.model(actionMindMap)
// app.model(actionLogin)

app.route(router)
const App = app.run()

const rootEl = document.getElementById('root')

render(
    <AppContainer>
        <App />
    </AppContainer>,
    rootEl
)

// Hot Module Replacement API
declare let module: { hot: any }

if (module.hot) {
    module.hot.accept('./components/app', () => {
        const NewApp = require('./components/app').default

        render(
            <AppContainer>
                <NewApp />
            </AppContainer>,
            rootEl
        )
    })
}
