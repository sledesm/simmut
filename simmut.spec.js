const simmut = require('simmut');

describe('simmut', () => {
    it('creates empty model', () => {
        const model = simmut.instance();
        expect(model.get()).toEqual({});
    });
    it('creates filled model', () => {
        const model = simmut.instance({foo: 'bar'});
        expect(model.get()).toEqual({foo: 'bar'});
    })
    it('sets correctly a model when no path is passed', () => {
        const model = simmut.instance();
        model.set(null, {foo: 'bar'});
        expect(model.get()).toEqual({foo: 'bar'});
    });
    it('sets correctly a model within a path', () => {
        const model = simmut.instance();
        model.set('foo', 'bar');
        expect(model.get()).toEqual({foo: 'bar'});
    });
    it('sets correctly model in a deep path', () => {
        const model = simmut.instance();
        model.set('a.b.c', {value: 'bar'});
        expect(model.get()).toEqual({a: {b: {c: {value: 'bar'}}}});
    });
    it('gets correctly a part of the model', () => {
        const model = simmut.instance();
        model.set('a.b.c', {value: 'bar'});
        expect(model.get('a.b')).toEqual({c: {value: 'bar'}});
    });
    it('correctly creates new objects', () => {
        const model = simmut.instance();
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
        const model = simmut.instance();
        model.set('foo', value);
        const retrieved = model.get('foo');
        expect(retrieved !== value).toBe(true);
        expect(retrieved).toStrictEqual(value);
    });
    it('does not clone a value when cloneValue=false', () => {
        const value = {
            foo: 'bar'
        };
        const model = simmut.instance();
        model.set('test', value, false);
        const retrieved = model.get('test');
        expect(retrieved === value).toBe(true);
    });
    it('deletes a part of the model', () => {
        const model = simmut.instance();
        model.set('a.b', 3);
        expect(model.get('a.b')).toBe(3);
        model.del('a.b');
        expect(model.get('a')).toStrictEqual({});
    })
    it('delete does nothing when path does not exist', () => {
        const model = simmut.instance();
        model.set('a.b', 3);
        model.del('a.c.h');
        expect(model.get()).toStrictEqual({a: {b: 3}});
    });

    describe('merge', () => {
        it('throws when merging root with non object', () => {
            const model = simmut.instance();
            expect(() => {
                model.merge(null, null)
            }).toThrowError();
            expect(() => {
                model.merge(null, 3)
            }).toThrowError();
        });
        it('merges correctly at root level', () => {
            const model = simmut.instance();
            const dataBefore = model.get();
            model.merge(null, {foo: 'bar'});
            const dataAfter = model.get();
            expect(dataBefore === dataAfter).toBe(false);
            expect(dataAfter).toEqual({foo: 'bar'});
        })
        it('merges correctly null object', () => {
            const model = simmut.instance();
            model.merge('foo', null);
            expect(model.get()).toEqual({foo: null});
        })
        it('merges correctly an object', () => {
            debugger;
            const model = simmut.instance();
            model.set('test.foo.value', 'bar');
            model.set('test.foo.valueAlt', 'barAlt');
            const dataBefore = model.get();
            model.merge('test.foo', {value2: 'bar2'});
            const dataAfter = model.get();
            expect(dataBefore === dataAfter).toBe(false);
            expect(dataBefore.test === dataAfter.test).toBe(false);
            expect(dataBefore.test.foo === dataAfter.test.foo).toBe(false);
            expect(dataBefore.valueAlt === dataAfter.valueAlt).toBe(true);
            expect(dataAfter).toStrictEqual({
                test: {
                    foo: {
                        value: 'bar',
                        valueAlt: 'barAlt',
                        value2: 'bar2',
                    }
                }
            });
        });
        it('merges correctly basic data types', () => {
            const model = simmut.instance();
            const right = {
                boolean: true,
                string: 'hello',
                number: 1.2,
                regex: /a/,
                func: () => null,
                array: [1, 2, 3],
                deepArray: [{a: 1, b: [3, 4]}, 'foo', 3],
                nullObj: null,
                undefinedObj: undefined,
            };
            model.merge('test.foo', right);
            const dataAfter = model.get('test.foo');
            expect(dataAfter).toStrictEqual(right);
            expect(dataAfter === right).toBe(false);
        })
        it('creates object when merging non object', () => {
            const model = simmut.instance();
            model.set('foo', 3);
            const dataBefore = model.get();
            model.merge('foo', {value: 'bar'});
            const dataAfter = model.get();
            expect(dataBefore !== dataAfter).toBe(true);
            expect(dataAfter.foo).toStrictEqual({value: 'bar'});
        });
        it('replaces left object with basic type', () => {
            const model = simmut.instance();
            model.set('foo', {value: 'bar'});
            model.merge('foo', 3);
            expect(model.get('foo')).toBe(3);
        });
        it('merges simple arrays correctly', () => {
            const model = simmut.instance();
            model.set('foo', {value: 'bar'});
            model.merge('foo', [1, 2, 3, 4, {a: 'b'}]);
            expect(model.get('foo')).toEqual([1, 2, 3, 4, {a: 'b'}]);
        });
    });

});

describe('proxy', () => {
    it('creates a proxy correctly', () => {
        const model = simmut.instance();
        const proxy = simmut.proxy({model, prefix: 'test'});
        proxy.set('foo', 'bar');
        expect(model.get('test')).toStrictEqual({foo: 'bar'});
        expect(proxy.get('foo')).toEqual('bar');
        proxy.del('foo');
        expect(proxy.get()).toBeUndefined;
        expect(model.get()).toStrictEqual({test: {}});
        proxy.merge('foo', {value: 'bar'});
        expect(model.get()).toStrictEqual({test: {foo: {value: 'bar'}}});
        const model2 = simmut.instance();
        const proxy2 = simmut.proxy({model: model2, prefix: 'test2'});
        proxy2.set(null, 'bar');
        expect(proxy2.get()).toEqual('bar');
        proxy2.merge(null, {value: 'bar'});
        expect(proxy2.get()).toEqual({value: 'bar'});
    });
});

describe('layered', () => {
    it('creates a layered model', () => {
        const layered = simmut.layered({foo: 'bar'});
        expect(layered.get()).toEqual({foo: 'bar'});
        layered.addLayer(null, {foo: {value: 'bar'}, foo2: {value: 'bar2'}});
        layered.set('foo.value', 'barNew');
        expect(layered.get('foo')).toEqual({value: 'barNew'});
        layered.del('foo.value');
        expect(layered.get('foo')).toEqual({value: 'bar'});
        layered.del('foo.doesNotExist');
        expect(layered.get('foo')).toEqual({value: 'bar'});
    });
    it('fails when trying to add a layer once model mutated', () => {
        const layered = simmut.layered();
        layered.set('foo', 'bar');
        expect(() => {
            layered.addLayer(null, {foo: 'bar'});
        }).toThrowError();
        const layered2 = simmut.layered();
        layered2.merge('foo', 'bar');
        expect(() => {
            layered2.addLayer(null, {foo: 'bar'});
        }).toThrowError();
        layered.set('foo', 'bar2');
        expect(layered.get()).toEqual({'foo': 'bar2'});
        layered.merge('test', 'testValue');
        expect(layered.get()).toEqual({'foo': 'bar2', 'test': 'testValue'});
    });
});