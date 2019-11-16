const instance = (data) => {
    let _model = {};

    const clone = (value) => {
        switch (typeof (value)) {
            case 'boolean':
            case 'function':
            case 'number':
            case 'string':
            case 'undefined':
                return value;
        }
        if (value === null) {
            return value;
        }
        if (value instanceof RegExp) {
            return value;
        }
        if (value instanceof Array) {
            const newArray = [];
            for (let i = 0; i < value.length; i++) {
                newArray[i] = clone(value[i]);
            }
            return newArray;
        }
        const keys = Object.keys(value);
        const newObj = {};
        for (let i = 0; i < keys.length; i++) {
            key = keys[i];
            newObj[key] = clone(value[key]);
        }
        return newObj;
    }

    const del = (path) => {
        let parts = path.split('.');
        _model = {
            ..._model,
        };
        let iter = _model;
        for (let i = 0; iter && i < parts.length - 1; i++) {
            const part = parts[i];
            if (iter[part]) {
                iter[part] = {
                    ...(iter[part])
                }
            }

            iter = iter[part];
        }
        if (iter) {
            const lastPart = parts[parts.length - 1];
            delete iter[lastPart];
        }
    }

    const _merge = (left, right) => {
        switch (typeof (right)) {
            case 'boolean':
            case 'function':
            case 'number':
            case 'string':
            case 'undefined':
                return right;
            default:
                if (!right) {
                    return right;
                }
                if (right instanceof RegExp) {
                    return right;
                }
                if (right instanceof Array) {
                    const result = [];
                    for (let i = 0; i < right.length; i++) {
                        result[i] = clone(right[i]);
                    }
                    return result;
                } else {
                    let result;
                    if (left && typeof (left) === 'object' && !(left instanceof Array)) {
                        result = {...left};
                    } else {
                        result = {};
                    }

                    Object.keys(right).forEach((key) => {
                        result[key] = _merge(result[key], right[key]);
                    });
                    return result;
                }
        }
    }

    const merge = (path, right) => {
        if (path) {
            const parts = path.split('.');
            _model = {
                ..._model
            };
            let iter = _model;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                iter[part] = {
                    ...(iter[part] || {})
                }
                iter = iter[part];
            };
            const lastPart = parts[parts.length - 1];
            iter[lastPart] = _merge(iter[lastPart], right);
        } else {
            if (!right || typeof (right) !== 'object')
                throw new Error('Cannot merge an empty or a non object at top level');
            _model = _merge(_model, right);
        }
    }

    const set = (path, value, cloneValue = true) => {

        const newValue = cloneValue ? clone(value) : value;
        if (!path) {
            if (value && typeof (value) == 'object') {
                _model = newValue;
            }
        } else {
            let parts = path.split('.');
            _model = {
                ..._model
            };
            iter = _model;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i < parts.length - 1) {
                    iter[part] = {
                        ...(iter[part] || {})
                    }
                    iter = iter[part];
                } else {
                    iter[part] = newValue;
                }
            }
        }

    }

    const get = (path) => {
        if (!path) {
            return _model;
        }
        let iter = _model;
        const parts = path.split('.');
        for (let i = 0; iter && i < parts.length; i++) {
            const part = parts[i];
            iter = iter[part];
        }
        return iter;
    }


    set(null, data);

    return {
        del,
        get,
        merge,
        set,
    }
}

const proxy = ({model, prefix}) => {
    return {
        del: (path) => model.del(`${prefix}.${path}`),
        get: (path) => model.get(path ? `${prefix}.${path}` : prefix),
        merge: (path, right) => model.merge(path ? `${prefix}.${path}` : prefix, right),
        set: (path, value, cloneValue) => model.set(
            path ? `${prefix}.${path}` : prefix,
            value,
            cloneValue,
        ),
    }
}

const layered = (data) => {
    let _layered = null;
    let _model = instance(data);

    const addLayer = (path, layerData) => {
        if (_layered) {
            throw new Error('Cannot add layers once data is set');
        }
        _model.merge(path, layerData);
    };

    const get = (...args) => _model.get(...args);

    const set = (...args) => {
        if (!_layered) {
            _layered = _model.get();
        }
        _model.set(...args);
    };

    const merge = (...args) => {
        if (!_layered) {
            _layered = _model.get();
        }
        _model.merge(...args);
    };

    const _get = (root, path) => {
        let iter = root;
        const parts = path.split('.');
        for (let i = 0; iter && i < parts.length; i++) {
            const part = parts[i];
            iter = iter[part];
        }
        return iter;
    }
    // When we delete a property, the layered one must come up
    const del = (path) => {
        _model.del(path);
        const valueBefore = _get(_layered, path);
        if (valueBefore !== undefined) {
            _model.set(path, valueBefore);
        };
    };
    return {
        addLayer,
        del,
        get,
        merge,
        set,
    }
}

module.exports = {
    instance,
    proxy,
    layered,
}