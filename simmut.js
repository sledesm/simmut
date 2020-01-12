const EventEmitter = require("events");

// Generic get. Given a model and a path, retrieve what's in the path
// If the model contains a get function, we use that one
const get = (model, path) => {
  if (model && model.get) {
    return model.get(path);
  }
  if (!path) {
    return model;
  }
  let iter = model;
  const parts = path.split(".");
  for (let i = 0; iter && i < parts.length; i++) {
    const part = parts[i];
    iter = iter[part];
  }
  return iter;
};

// Creates a duplicate sharing children
const _duplicate = item => {
  if (!item) {
    return {};
  }
  if (item instanceof Array) {
    return [...item];
  } else {
    return { ...item };
  }
};

// Deep cloning
const clone = value => {
  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return value;
    case "object": {
      if (value === null) {
        return value;
      }

      // If the object is frozen, we assume that it will be
      // frozen all the way down
      if (Object.isFrozen(value)) {
        return value;
      }

      if (value instanceof RegExp) {
        return Object.freeze(new RegExp(value));
      }

      if (value.buffer && value.buffer instanceof ArrayBuffer) {
        throw new Error("Models cannot contain typed arrays");
      }
      if (value instanceof Array) {
        newArray = cloneArray(value);
        Object.freeze(newArray);
        return newArray;
      }
      const keys = Object.keys(value);
      const newObj = {};
      for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        newObj[key] = clone(value[key]);
      }
      Object.freeze(newObj);
      return newObj;
    }
    default:
      throw new Error(`Cannot clone data of type ${typeof value}`);
  }
};

// We have a specialised function so that JIT can optimize the loop
// If we have a generic cloneArray function it will be polymorphic and
// therefor very slow
const cloneBooleanArray = value => {
  const result = [];
  const l = value.length | 0;
  for (let i = 0; i < l; i++) {
    result.push(value[i]);
  }
  return result;
};

// This code is a copy on purpose to be able to get advantage of JIT compilation
const cloneStringArray = value => {
  const result = [];
  const l = value.length | 0;
  for (let i = 0; i < l; i++) {
    result.push(value[i]);
  }
  return result;
};

const cloneNumberArray = value => {
  const result = [];
  const l = value.length | 0;
  for (let i = 0; i < l; i++) {
    result.push(value[i]);
  }
  return result;
};

const cloneArray = value => {
  // For speed up purposes, we will assume that all the elements of an array
  // are of the same type. If this is a simple type (string,boolean,number)
  // we will not clone the array, but just copy all the values.
  // Please note that this implies that the library will not work properly
  // with mixed arrays line [3,{foo:bar}], as it will not freeze {foo:bar}
  // But we assume that this is a very unlikely event to happen and worst
  // case scenario is that those particular records will not be frozen.
  // By doing this optimization, we will be able to deal with very large
  // geometry structures or list of strings which will be made out of flat
  // arrays.
  if (value.length) {
    const firstElement = value[0];

    switch (typeof firstElement) {
      case "boolean":
        return cloneBooleanArray(value);
      case "number":
        return cloneNumberArray(value);
      case "string":
        return cloneStringArray(value);
      default: {
        const newArray = [];

        for (let i = 0; i < value.length; i++) {
          newArray[i] = clone(value[i]);
        }
        return newArray;
      }
    }
  } else {
    return [];
  }
};

const instance = data => {
  let _model = {};
  const _eventEmitter = new EventEmitter();

  const del = path => {
    let parts = path.split(".");
    _model = _duplicate(_model);

    let iter = _model;
    for (let i = 0; iter && i < parts.length - 1; i++) {
      const part = parts[i];
      if (iter[part]) {
        iter[part] = _duplicate(iter[part]);
      }
      Object.freeze(iter);
      iter = iter[part];
    }
    if (iter) {
      const lastPart = parts[parts.length - 1];
      delete iter[lastPart];
    }
    Object.freeze(iter);
    Object.freeze(_model);
    _eventEmitter.emit("change");
  };

  const _merge = (left, right) => {
    switch (typeof right) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return right;
      case "object":
        if (!right) {
          return right;
        }
        // If right is a frozen object and we do not have
        // a corresponding left, we return the right object
        if (Object.isFrozen(right)) {
          if (!left || !(left instanceof Object)) {
            return right;
          }
          // If both left and right are frozen and they
          // refer to the same object, it means that they are
          // equal so we do not have to perform any further merging
          if (left === right && Object.isFrozen(left)) {
            return right;
          }
        }

        if (right instanceof RegExp) {
          return Object.freeze(new RegExp(right));
        }
        if (right.buffer && right.buffer instanceof ArrayBuffer) {
          throw new Error("Models cannot contain typed arrays");
        }
        if (right instanceof Array) {
          let result;
          if (left instanceof Array) {
            result = [...left];
          } else {
            result = [];
          }
          for (let i = 0; i < right.length; i++) {
            if (right[i] !== undefined) {
              result[i] = clone(right[i]);
            }
          }
          return result;
        } else {
          let result;
          if (left && typeof left === "object" && !(left instanceof Array)) {
            result = { ...left };
          } else {
            result = {};
          }

          Object.keys(right).forEach(key => {
            result[key] = _merge(result[key], right[key]);
          });
          return result;
        }
      default:
        throw new Error(`Cannot merge data of type ${typeof right}`);
    }
  };

  const merge = (path, right) => {
    if (path) {
      const parts = path.split(".");
      _model = {
        ..._model
      };
      let iter = _model;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        iter[part] = _duplicate(iter[part]);
        iter = iter[part];
      }
      const lastPart = parts[parts.length - 1];
      iter[lastPart] = _merge(iter[lastPart], right);
      Object.freeze(iter);
    } else {
      if (!right || typeof right !== "object")
        throw new Error("Cannot merge an empty or a non object at top level");
      _model = _merge(_model, right);
      Object.freeze(_model);
    }
    _eventEmitter.emit("change");
  };

  const set = (path, value, cloneValue = true) => {
    const newValue = cloneValue ? clone(value) : value;
    if (!path) {
      if (value && typeof value == "object") {
        _model = newValue;
      }
    } else {
      let parts = path.split(".");
      _model = _duplicate(_model);

      iter = _model;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i < parts.length - 1) {
          iter[part] = _duplicate(iter[part]);

          Object.freeze(iter);
          iter = iter[part];
        } else {
          iter[part] = newValue;
          Object.freeze(iter);
        }
      }
    }
    Object.freeze(_model);
    _eventEmitter.emit("change");
  };

  const _get = path => {
    return get(_model, path);
  };

  const on = (...args) => _eventEmitter.on(...args);
  const off = (...args) => _eventEmitter.off(...args);

  set(null, data);

  return {
    del,
    get: _get,
    merge,
    set,
    on,
    off
  };
};

const proxy = ({ model, prefix }) => {
  return {
    del: path => model.del(`${prefix}.${path}`),
    get: path => model.get(path ? `${prefix}.${path}` : prefix),
    merge: (path, right) =>
      model.merge(path ? `${prefix}.${path}` : prefix, right),
    set: (path, value, cloneValue) =>
      model.set(path ? `${prefix}.${path}` : prefix, value, cloneValue)
  };
};

const layered = data => {
  let _layered = null;
  let _model = instance(data);

  const addLayer = (path, layerData) => {
    if (_layered) {
      throw new Error("Cannot add layers once data is set");
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
    const parts = path.split(".");
    for (let i = 0; iter && i < parts.length; i++) {
      const part = parts[i];
      iter = iter[part];
    }
    return iter;
  };
  // When we delete a property, the layered one must come up
  const del = path => {
    _model.del(path);
    const valueBefore = _get(_layered, path);
    if (valueBefore !== undefined) {
      _model.set(path, valueBefore);
    }
  };
  return {
    addLayer,
    del,
    get,
    merge,
    set
  };
};

module.exports = {
  get,
  instance,
  proxy,
  layered
};
