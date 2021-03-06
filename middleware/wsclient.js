!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):(e=e||self).PersistentWebSocket=n()}(this,function(){"use strict";return function(e,n,o,t){"function"==typeof n&&("object"==typeof o&&(t=o),o=n,n=void 0),Array.isArray(n)||"object"!=typeof n||(t=n,n=void 0),"object"==typeof o&&(t=o,o=void 0);var r="undefined"!=typeof window&&window.WebSocket;if(r&&(o=o||window.WebSocket,"undefined"!=typeof window&&"function"==typeof window.addEventListener&&window.addEventListener("online",v)),!o)throw new Error("Please supply a websocket library to use");t||(t={});var i,c=null,u=!1,a=null,f=null,s=null,l=!1,p=null,d={},y={},m={},w={},E={CONNECTING:"CONNECTING"in o?o.CONNECTING:0,OPEN:"OPEN"in o?o.OPEN:1,CLOSING:"CLOSING"in o?o.CLOSING:2,CLOSED:"CLOSED"in o?o.CLOSED:3,get readyState(){return c.readyState},get protocol(){return c.protocol},get extensions(){return c.extensions},get bufferedAmount(){return c.bufferedAmount},get binaryType(){return c.binaryType},set binaryType(e){s=e,c.binaryType=e},connect:v,url:e,retries:0,pingTimeout:"pingTimeout"in t&&t.pingTimeout,maxTimeout:t.maxTimeout||3e5,maxRetries:t.maxRetries||0,nextReconnectDelay:t.nextReconnectDelay||function(e){return Math.min((1+Math.random())*Math.pow(1.5,e)*1e3,E.maxTimeout)},send:function(){c.send.apply(c,arguments)},close:function(){clearTimeout(a),l=!0,c.close.apply(c,arguments)},onopen:t.onopen,onmessage:t.onmessage,onclose:t.onclose,onerror:t.onerror},T=function(e,n,o){return function(t,r,u){function a(n){u&&u.once&&c["on"===e?"off":"removeEventListener"](t,a),n&&"object"==typeof n&&i&&(n.reconnectDelay=i),r.apply(E,arguments)}t in n?n[t].push(r):n[t]=[r],t in o?o[t].push(a):o[t]=[a],c&&c[e](t,a)}},b=function(e,n,o){return function(t,r){var i=n[t].indexOf(r);-1!==i&&(c&&c[e](t,o[t][i]),n[t].splice(i,1),o[t].splice(i,1))}};return E.addEventListener=T("addEventListener",d,y),E.removeEventListener=b("removeEventListener",d,y),E.on=T("on",m,w),E.off=b("off",m,w),E.once=function(e,n){return E.on(e,n,{once:!0})},e&&v(),E;function v(e){if(l=!1,clearTimeout(a),"string"==typeof e&&(E.url=e),c&&3!==c.readyState)return D(4665,"Manual connect initiated");u=!1,e="function"==typeof E.url?E.url(E):E.url,(c=r?n?new o(e,n):new o(e):new o(e,n,t)).onclose=h,c.onerror=g,c.onopen=O,c.onmessage=N,Object.keys(y).forEach(function(e){y[e].forEach(function(n){return c.addEventListener(e,n)})}),Object.keys(w).forEach(function(e){w[e].forEach(function(n){return c.on(e,n)})}),s&&(c.binaryType=s)}function h(e,n){clearTimeout(f),e.reconnectDelay=Math.ceil(L()),p=null,E.onclose&&E.onclose.apply(E,arguments)}function g(e){e||(e=new Error("UnknownError")),e.reconnectDelay=Math.ceil(L()),E.onerror&&E.onerror.apply(E,arguments)}function O(e){E.onopen&&E.onopen.apply(E,arguments),x(),p=Date.now()}function N(e){E.onmessage&&E.onmessage.apply(E,arguments),x()}function x(){E.pingTimeout&&(clearTimeout(f),f=setTimeout(C,E.pingTimeout))}function C(){D(4663,"No heartbeat received within "+E.pingTimeout+"ms")}function L(){if(!l){if(u)return i-(Date.now()-u);if(u=Date.now(),E.retries=p&&Date.now()-p>i?1:E.retries+1,!(E.maxRetries&&E.retries>=E.maxRetries))return i=E.nextReconnectDelay(E.retries),a=setTimeout(v,i),i}}function D(e,n){l=!0,setTimeout(S,0,c);var o=function(e,n){var o;return"undefined"!=typeof window&&window.CloseEvent?o=new window.CloseEvent("HeartbeatTimeout",{wasClean:!0,code:e,reason:n}):((o=new Error("HeartbeatTimeout")).code=e,o.reason=n),o}(e,n);h(o),y.close&&y.close.forEach(function(e){return e(o)}),w.close&&w.close.forEach(function(o){return o(e,n,i)})}function S(e){e.onclose=e.onopen=e.onerror=e.onmessage=null,Object.keys(y).forEach(function(n){y[n].forEach(function(o){return e.removeEventListener(n,o)})}),Object.keys(w).forEach(function(n){w[n].forEach(function(o){return e.off(n,o)})}),e.close()}}});

var ws = new PersistentWebSocket('ws://localhost:8001/mind/')

ws.onopen = function open() {
  console.log('connected')
  sendWsMsg(ws, Date.now())
}

ws.onclose = function close() {
  console.log('disconnected')
}

ws.onmessage = function incoming(data) {
  console.log(`Roundtrip time: ${Date.now() - data} ms`)

  setTimeout(function timeout() {
    sendWsMsg(ws, Date.now())
  }, 500)
}
ws.onerror = e=>console.log('ws error:', e)

function sendWsMsg(ws, msg){
    if(ws.readyState === ws.CLOSED) {
        console.log('ws closed')
    } else {
        ws.send(msg)
    }
}
