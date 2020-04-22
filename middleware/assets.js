const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const debug = require('debug')('mid-assets')
var tcpPortUsed = require('tcp-port-used')
var defaultPort = process.env.ASSETS_PORT || 8080

module.exports = (app, cfg) => {
    // webpack-dev-server --port=8080  --config=configs/webpack/dev.js
    const {
        port = defaultPort,
        host = '127.0.0.1',
        cmd = 'node_modules/.bin/webpack-dev-server',
        args = ['--port', cfg.port || defaultPort, '--config', 'configs/webpack/dev.js'],
        router = '/assets/',
        env,
        cwd
    } = cfg
    tcpPortUsed.check(port, host).then((inUse) => {
        console.log(`Port ${port} usage: `+inUse)
        if(!inUse) {
            const child = spawn(
                cmd, args,
                {
                    env: {
                        ...process.env,
                        ...env
                    },
                    cwd: cwd || path.join(__dirname, '../assets'),
                    stdio: 'inherit',
                }
            )
            process.on('exit', function () {
                console.log('process exit')
                // child && child.kill()
            })
            process.on('SIGINT', function () {
                child.kill()
                process.exit(0)
            })
        }
    }, (err) => {
        console.error('Error on check tcp-port:', err.message)
    })


    return (req, res, next) => {
        const isAssets = req.path.startsWith(router)
        const isHotUpdater = /\.hot-update\.\w+$/i.test(req.path)

        if (isAssets || isHotUpdater) {
            const id = `${req.method} ${req.url}`
            const part2 = isAssets ? req.url.replace(router, '/') : req.url
            const targetUrl = `http://${host}:${port}` + part2
            debug(targetUrl)
            const req2 = http.request(targetUrl, res2 => {
                debug("[%s] 响应: %s", id, res2.statusCode);
                res.writeHead(res2.statusCode, res2.headers);
                res2.pipe(res);
            });

            function bindError(req, res) {
                return (err) => {
                    const msg = String(err.stack || err);
                    debug("[%s] 发生错误: %s", id, msg);
                    if (!res.headersSent) {
                        res.writeHead(500, { "content-type": "text/plain" });
                    }
                    res.end(msg);
                };
            }
            req2.on('error', bindError(req, res))

            req.pipe(req2);

        } else {
            next()
        }
    }
}