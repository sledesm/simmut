const immut = require('immut');

describe('immut', () => {
    it('creates empty model', () => {
        const model = immut.instance();
        expect(model.get()).toEqual({});
    });
    it('sets correctly a model when no path is passed', () => {
        const model = immut.instance();
        model.set(null, {foo: 'bar'});
        expect(model.get()).toEqual({foo: 'bar'});
    });
    it('sets correctly a model within a path', () => {
        const model = immut.instance();
        model.set('foo', 'bar');
        expect(model.get()).toEqual({foo: 'bar'});
    });
    it('sets correctly model in a deep path', () => {
        const model = immut.instance();
        model.set('a.b.c', {value: 'bar'});
        expect(model.get()).toEqual({a: {b: {c: {value: 'bar'}}}});
    });
    it('gets correctly a part of the model', () => {
        const model = immut.instance();
        model.set('a.b.c', {value: 'bar'});
        expect(model.get('a.b')).toEqual({c: {value: 'bar'}});
    });
    it('correctly creates new objects', () => {
        const model = immut.instance();
        model.set('a.b.c', 'v1');
        const first = model.get();
        model.set('a.h.l', 'v2');
        const second = model.get();
        // Root has to be a new object
        expect(first === second).toBe(false);
        // Any object part of the path has to be a new object
        expect(first.a === second.a).toBe(false);
        // Untouched parts of the path must be the same
        expect(first.b === second.b).toBe(true);
    });
    it('clones the value', () => {
        const value = {
            deep: {
                boolean: true,
                string: 'hello',
                number: 1.2,
                regex: /a/,
                func: () => null,
                array: [1, 2, 3],
                deepArray: [{a: 1, b: [3, 4]}, 'foo', 3],
                nullObj: null,
                undefinedObj: undefined,
            }
        };
        const model = immut.instance();
        model.set('foo', value);
        const retrieved = model.get('foo');
        expect(retrieved !== value).toBe(true);
        expect(retrieved).toStrictEqual(value);
    });
    it('does not clone a value when cloneValue=false', () => {
        const value = {
            foo: 'bar'
        };
        const model = immut.instance();
        model.set('test', value, false);
        const retrieved = model.get('test');
        expect(retrieved === value).toBe(true);
    });
    it('deletes a part of the model', () => {
        const model = immut.instance();
        model.set('a.b', 3);
        expect(model.get('a.b')).toBe(3);
        model.del('a.b');
        expect(model.get('a')).toStrictEqual({});
    })
    it('delete does nothing when path does not exist', () => {
        const model = immut.instance();
        model.set('a.b', 3);
        model.del('a.c.h');
        expect(model.get()).toStrictEqual({a: {b: 3}});
    });
    it('creates a proxy correctly', () => {
        const model = immut.instance();
        const proxy = immut.proxy({model, prefix: 'test'});
        proxy.set('foo', 'bar');
        expect(model.get('test')).toStrictEqual({foo: 'bar'});
        expect(proxy.get('foo')).toEqual('bar');
        proxy.del('foo');
        expect(proxy.get()).toBeUndefined;
        expect(model.get()).toStrictEqual({test: {}});
    })

})