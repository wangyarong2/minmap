module.exports = {
    debug: true,
    middleware: {
        static: {
            enable: false,
        },
        assets: {
            enable: true,
            module: '../middleware/assets.js',
            config: {
                port: 8888
            }
        }
    }
}