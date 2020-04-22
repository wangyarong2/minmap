const dotenv = require('dotenv').config();
const OSS = require('ali-oss');
const async = require('async');
const path = require('path');
const lodash = require('lodash');
const fs = require('fs');
const pkg = require('../package.json')

const prefix = pkg.name + '_' + pkg.version

const client = new OSS({
    region: dotenv.parsed ? dotenv.parsed.OSS_REGION : process.env.OSS_REGION || '',
    accessKeyId: dotenv.parsed? dotenv.parsed.OSS_AK_ID : process.env.OSS_AK_ID || '',
    accessKeySecret:  dotenv.parsed ? dotenv.parsed.OSS_AK_SEC : process.env.OSS_AK_SEC || '',
    bucket:  dotenv.parsed ? dotenv.parsed.OSS_AK_BUCKET : process.env.OSS_AK_BUCKET || '',
    endpoint: dotenv.parsed ? dotenv.parsed.OSS_ENDPOINT : process.env.OSS_ENDPOINT || '' 
})

async function uploadFileToOss () {

    try {
        const baseFolder = '/out/release'
        const fromEjsPath = './view/index.ejs'
        const toEjsPath = `.${baseFolder}/view/index.ejs`

        const assets = require(`..${baseFolder}/assets/assets.json`)
        const htmlContent = fs.readFileSync(fromEjsPath, 'utf8')
        const appendStr = []
        const filesToUploads = lodash.flatten(assets.map(v=>v.files.filter(v=>/\.(js|css)$/i.test(v))))
        console.log('filesToUploads', filesToUploads)
        Promise.all(filesToUploads.map(v=>{
            return client.put(`assets/${prefix}/${v}`, path.join(__dirname, `..${baseFolder}/assets/${v}`), { timeout: 12000 })
        })).then(results=>{
            // console.log(results)
            // [{name, url, res:{status}}]
            results.map(v=>{
                if(v.name.endsWith('.js')){
                    appendStr.push(`<script src="${v.url}"></script>`)
                }
                if(v.name.endsWith('.css')){
                    appendStr.push(`<link rel="stylesheet" href="${v.url}">`)
                }
            })
            const newContent = htmlContent.replace('</body>', appendStr.join('\n') + '\n</body>')
            fs.writeFileSync(toEjsPath, newContent)
        })

    } catch (err) {
        console.log('upload-err-->>', err)
    }
}

uploadFileToOss();

