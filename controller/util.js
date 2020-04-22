function flatNodes(tree, options = {}) {
    const { store = [], end } = options || {}
    options = Object.assign({ store }, options)
    const { children, ...props } = tree
    const len = store.length
    if (end != null && len > end) {
        return [store, true]
    }
    store.push(props)
    if (children) {
        children.some(v => {
            if (!v) return
            const [store, isEnd] = flatNodes(v, options)
            return isEnd
        })
    }
    return [store]
}

module.exports = {
    flatNodes
}
