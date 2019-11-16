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
        let iter = _model;
        for (let i = 0; iter && i < parts.length - 1; i++) {
            const part = parts[i];
            iter = iter[part];
        }
        if (iter) {
            const lastPart = parts[parts.length - 1];
            delete iter[lastPart];
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
        get,
        set,
        del,
    }
}

const proxy = ({model, prefix}) => {
    return {
        get: (path) => model.get(path ? `${prefix}.${path}` : prefix),
        set: (path, value, cloneValue) => model.set(
            path ? `${prefix}.${path}` : prefix,
            value,
            cloneValue,
        ),
        del: (path) => model.del(path ? `${prefix}.${path}` : prefix),
    }
}

module.exports = {
    instance,
    proxy,
}