module.exports = (packed, { isWrapper, createWrap }) =>
  (packed.ww = function (paths) {
    function emit (edataValue, changeType) {
      packed.root.observer.value = {
        data: edataValue,
        type: packed.root.MUTATION_TYPE[changeType]
      }
    }
    function observe (edata) {
      function buildProxy (o) {
        const ret = new Proxy(isWrapper(o) ? o.value : o, {
          deleteProperty (target, property) {
            if (isWrapper(target[property])) {
              target[property].unset()
            } else if (isWrapper(o)) {
              o.unset(property)
            } else {
              // fallback to normal proxy
              return delete target[property]
            }
            return true
          },
          set (target, property, value) {
            //   console.log(target, property, value)
            if (isWrapper(target[property])) {
              target[property].set(value)
            } else if (isWrapper(o)) {
              o.set(property, value)
            } else {
              // fallback to normal proxy
              target[property] = value
            }
            return true
          },
          get (target, property) {
            // Special properties
            if (property === '__target') return target
            if (property === '__isProxy') return true
            if (property === '__edata') return o
            // return a new proxy if possible, add to prefix
            let out
            if (property in target) {
              out = target[property]
            } else if (isWrapper(o)) {
              out = o.set(property, {})
            } else {
              return
            }
            let next = out
            while (isWrapper(out)) out = out.value
            //   console.log(property, out, target, next, o)
            if (typeof out === 'function') {
              return function (...args) {
                const ret =
                  typeof o[property] === 'function'
                    ? o[property](...args)
                    : out.apply(target, args)
                // console.log(ret, 999)
                return ret instanceof Object ? buildProxy(ret) : ret
              }
            } else {
              return out instanceof Object ? buildProxy(next) : out
            }
          }
        })
        return ret
      }
      return buildProxy(edata)
    }
    return observe(this)
  })
