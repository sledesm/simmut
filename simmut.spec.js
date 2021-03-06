const simmut = require("simmut");

describe("get", () => {
  it("retrieves correctly a value", () => {
    const data = {
      foo: "bar"
    };
    expect(simmut.get(data, "foo")).toBe("bar");
  });
  it("retrieves undefined if the value not in the model", () => {
    const data = {};
    expect(simmut.get(data, "foo")).toBeUndefined();
  });
  it("retrieves the model when model is falsy", () => {
    const data = null;
    expect(simmut.get(data, "foo")).toBe(null);
  });
  it("retrieves the model from an instanced model", () => {
    const model = simmut.instance();
    model.set("foo", "bar");
    expect(model.get("foo")).toBe("bar");
    expect(simmut.get(model, "foo")).toBe("bar");
  });
});

describe("simmut", () => {
  it("creates empty model", () => {
    const model = simmut.instance();
    expect(model.get()).toEqual({});
  });
  it("creates filled model", () => {
    const model = simmut.instance({ foo: "bar" });
    expect(model.get()).toEqual({ foo: "bar" });
  });
  it("throws when setting not basic data types", () => {
    const model = simmut.instance();
    expect(() => {
      model.set("foo", () => null);
    }).toThrowError();
    expect(() => {
      model.set("foo", new Uint8Array(1));
    }).toThrowError();
  });
  it("sets correctly a model when no path is passed", () => {
    const model = simmut.instance();
    model.set(null, { foo: "bar" });
    expect(model.get()).toEqual({ foo: "bar" });
  });
  it("sets correctly a model within a path", () => {
    const model = simmut.instance();
    model.set("foo", "bar");
    expect(model.get()).toEqual({ foo: "bar" });
    const sampleArray = [{ id: 1 }, { id: 2 }];
    model.set("ar", sampleArray);
    expect(model.get("ar")).toEqual(sampleArray.slice());
  });
  it("sets correctly model in a deep path", () => {
    const model = simmut.instance();
    model.set("a.b.c", { value: "bar" });
    expect(model.get()).toEqual({ a: { b: { c: { value: "bar" } } } });
  });
  it("does not clone immutable objects when setting", () => {
    const model = simmut.instance();
    model.set("a.b.c", { value: "bar" });
    const first = model.get();
    model.set("d", first.a);
    const second = model.get("d");

    expect(first.a === second.d);
  });
  it("gets correctly a part of the model", () => {
    const model = simmut.instance();
    model.set("a.b.c", { value: "bar" });
    expect(model.get("a.b")).toEqual({ c: { value: "bar" } });
  });
  it("correctly creates new objects", () => {
    const model = simmut.instance();
    model.set("a.b.c", "v1");
    const first = model.get();
    model.set("a.h.l", "v2");
    const second = model.get();
    // Root has to be a new object
    expect(first === second).toBe(false);
    // Any object part of the path has to be a new object
    expect(first.a === second.a).toBe(false);
    // Untouched parts of the path must be the same
    expect(first.b === second.b).toBe(true);
  });
  it("clones the value", () => {
    const value = {
      deep: {
        boolean: true,
        string: "hello",
        number: 1.2,
        regex: /a/,
        array: [1, 2, 3],
        deepArray: [{ a: 1, b: [3, 4] }, "foo", 3],
        nullObj: null,
        undefinedObj: undefined
      }
    };
    const model = simmut.instance();
    model.set("foo", value);
    const retrieved = model.get("foo");
    expect(retrieved !== value).toBe(true);
    expect(retrieved).toStrictEqual(value);
  });
  it("does not clone a value when cloneValue=false", () => {
    const value = {
      foo: "bar"
    };
    const model = simmut.instance();
    model.set("test", value, false);
    const retrieved = model.get("test");
    expect(retrieved === value).toBe(true);
  });
  it("deletes a part of the model", () => {
    const model = simmut.instance();
    model.set("a.b", 3);
    model.set("a.h", { value: "i" });
    const modelBefore = model.get();
    expect(model.get("a.b")).toBe(3);
    model.del("a.b");
    expect(model.get("a")).toStrictEqual({ h: { value: "i" } });
    const modelAfter = model.get();
    expect(modelBefore === modelAfter).toBe(false);
    expect(modelBefore.a === modelAfter.a).toBe(false);
    expect(modelBefore.a.h === modelAfter.a.h).toBe(true);
  });
  it("delete does nothing when path does not exist", () => {
    const model = simmut.instance();
    model.set("a.b", 3);
    model.del("a.c.h");
    expect(model.get()).toStrictEqual({ a: { b: 3 } });
  });
  it("clones correctly empty arrays", () => {
    const model = simmut.instance([]);
    expect(model.get()).toEqual([]);
  });
  it("clones correctly boolean arrays", () => {
    const model = simmut.instance([true, false]);
    expect(model.get()).toEqual([true, false]);
  });
  it("clones correctly string arrays", () => {
    const model = simmut.instance(["hello", "world"]);
    expect(model.get()).toEqual(["hello", "world"]);
  });
  it("clones correctly number arrays", () => {
    const model = simmut.instance([0, 1]);
    expect(model.get()).toEqual([0, 1]);
  });

  describe("merge", () => {
    it("throws when merging root with non object", () => {
      const model = simmut.instance();
      expect(() => {
        model.merge(null, null);
      }).toThrowError();
      expect(() => {
        model.merge(null, 3);
      }).toThrowError();
    });
    it("merges correctly at root level", () => {
      const model = simmut.instance();
      const dataBefore = model.get();
      model.merge(null, { foo: "bar" });
      const dataAfter = model.get();
      expect(dataBefore === dataAfter).toBe(false);
      expect(dataAfter).toEqual({ foo: "bar" });
    });
    it("merges correctly null object", () => {
      const model = simmut.instance();
      model.merge("foo", null);
      expect(model.get()).toEqual({ foo: null });
    });
    it("throws when merging not basic data types", () => {
      const model = simmut.instance();
      expect(() => {
        model.merge("foo", () => null);
      }).toThrowError();
      expect(() => {
        model.merge("foo", new Uint8Array(1));
      }).toThrowError();
    });

    it("merges correctly an object", () => {
      const model = simmut.instance();
      model.set("test.foo.value", "bar");
      model.set("test.foo.valueAlt", "barAlt");
      const dataBefore = model.get();
      model.merge("test.foo", { value2: "bar2" });
      const dataAfter = model.get();
      expect(dataBefore === dataAfter).toBe(false);
      expect(dataBefore.test === dataAfter.test).toBe(false);
      expect(dataBefore.test.foo === dataAfter.test.foo).toBe(false);
      expect(dataBefore.valueAlt === dataAfter.valueAlt).toBe(true);
      expect(dataAfter).toStrictEqual({
        test: {
          foo: {
            value: "bar",
            valueAlt: "barAlt",
            value2: "bar2"
          }
        }
      });
    });
    it("merges arrays correctly", () => {
      const model = simmut.instance([
        {
          id: 1,
          sub: [{ id: "1-1" }]
        }
      ]);
      model.set("0.sub.1", { id: "1-2" });
      expect(model.get()).toEqual([
        {
          id: 1,
          sub: [{ id: "1-1" }, { id: "1-2" }]
        }
      ]);
      model.merge(null, [undefined, { id: 2 }]);
      expect(model.get()).toEqual([
        {
          id: 1,
          sub: [{ id: "1-1" }, { id: "1-2" }]
        },
        {
          id: 2
        }
      ]);
    });
    it("merges correctly basic data types", () => {
      const model = simmut.instance();
      const right = {
        boolean: true,
        string: "hello",
        number: 1.2,
        regex: /a/,
        array: [1, 2, 3],
        deepArray: [{ a: 1, b: [3, 4] }, "foo", 3],
        nullObj: null,
        undefinedObj: undefined
      };
      model.merge("test.foo", right);
      const dataAfter = model.get("test.foo");
      expect(dataAfter).toStrictEqual(right);
      expect(dataAfter === right).toBe(false);
    });
    it("creates object when merging non object", () => {
      const model = simmut.instance();
      model.set("foo", 3);
      const dataBefore = model.get();
      model.merge("foo", { value: "bar" });
      const dataAfter = model.get();
      expect(dataBefore !== dataAfter).toBe(true);
      expect(dataAfter.foo).toStrictEqual({ value: "bar" });
    });
    it("replaces left object with basic type", () => {
      const model = simmut.instance();
      model.set("foo", { value: "bar" });
      model.merge("foo", 3);
      expect(model.get("foo")).toBe(3);
    });
    it("merges simple arrays correctly", () => {
      const model = simmut.instance();
      model.set("foo", { value: "bar" });
      model.merge("foo", [1, 2, 3, 4, { a: "b" }]);
      expect(model.get("foo")).toEqual([1, 2, 3, 4, { a: "b" }]);
    });

    it("reuses frozen objects when merging", () => {
      const model = simmut.instance();
      model.set("a.b.foo", { value: "bar" });
      const first = model.get();
      model.merge("j", first.a);
      const second = model.get();
      expect(first === second).toBe(false);
      expect(first.a === second.j).toBe(true);
    });
    it("reuses frozen objects when merging with different types", () => {
      const model = simmut.instance();
      model.set("a.b.foo", { value: "bar" });
      model.set("j", "test");
      const first = model.get();
      model.merge("j", first.a);
      const second = model.get();
      expect(first === second).toBe(false);
      expect(first.a === second.j).toBe(true);
    });
    it("merges correctly with frozen objects", () => {
      const model = simmut.instance();
      model.set("a.b.foo", { value: "bar" });
      model.set("j.k", { value: "test" });
      const first = model.get();
      model.merge("j", first.a);
      const second = model.get();
      expect(first === second).toBe(false);
      expect(first.a === second.j).toBe(false);
      expect(first.a.b === second.j.b).toBe(true);
    });
    it("Reuses immutable object for recurrent merging", () => {
      const model = simmut.instance();
      model.set("a.b.foo", { value: "bar" });
      const foo = model.get("a.b.foo");
      model.merge("a.b.foo", foo);
      const foo2 = model.get("a.b.foo");
      expect(foo == foo2).toBe(true);
    });
  });
});

describe("deepFreeze", () => {
  it("does not freeze not owned properties", () => {
    function DummyClass() {}
    DummyClass.prototype.notOwned = { foo: "bar" };
    const shape1 = new DummyClass();
    shape1.owned = { value: "bar2" };
    /*eslint-disable*/ debugger; /*eslint-enable*/
    const result = simmut.deepFreeze(shape1);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.owned)).toBe(true);
    expect(Object.isFrozen(result.notOwned)).toBe(false);
  });
  it("does not crash on basic types", () => {
    const res = simmut.deepFreeze("hello world");
    expect(Object.isFrozen(res)).toBe(true);
  });
  it("freezes falsy objects correctly", () => {
    const res = simmut.deepFreeze(null);
    expect(Object.isFrozen(res)).toBe(true);
  });
  it("freezes deep objects correctly", () => {
    const res = simmut.deepFreeze({ foo: { value: "bar" } });
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res.foo)).toBe(true);
  });
  it("freezes empty arrays correctly", () => {
    const res = simmut.deepFreeze([]);
    expect(Object.isFrozen(res)).toBe(true);
  });
  it("freezes deep arrays correctly", () => {
    const res = simmut.deepFreeze([{ a: 3 }, []]);
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res[0])).toBe(true);
  });
  it("freezes deep arrays of basic types corretly", () => {
    const res = simmut.deepFreeze([0, 1, 2]);
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res[0])).toBe(true);
  });
});

describe("proxy", () => {
  it("creates a proxy correctly", () => {
    const model = simmut.instance();
    const proxy = simmut.proxy({ model, prefix: "test" });
    proxy.set("foo", "bar");
    expect(model.get("test")).toStrictEqual({ foo: "bar" });
    expect(proxy.get("foo")).toEqual("bar");
    proxy.del("foo");
    expect(proxy.get()).toBeUndefined;
    expect(model.get()).toStrictEqual({ test: {} });
    proxy.merge("foo", { value: "bar" });
    expect(model.get()).toStrictEqual({ test: { foo: { value: "bar" } } });
    const model2 = simmut.instance();
    const proxy2 = simmut.proxy({ model: model2, prefix: "test2" });
    proxy2.set(null, "bar");
    expect(proxy2.get()).toEqual("bar");
    proxy2.merge(null, { value: "bar" });
    expect(proxy2.get()).toEqual({ value: "bar" });
  });
});

describe("layered", () => {
  it("creates a layered model", () => {
    const layered = simmut.layered({ foo: "bar" });
    expect(layered.get()).toEqual({ foo: "bar" });
    layered.addLayer(null, { foo: { value: "bar" }, foo2: { value: "bar2" } });
    layered.set("foo.value", "barNew");
    expect(layered.get("foo")).toEqual({ value: "barNew" });
    layered.del("foo.value");
    expect(layered.get("foo")).toEqual({ value: "bar" });
    layered.del("foo.doesNotExist");
    expect(layered.get("foo")).toEqual({ value: "bar" });
  });
  it("fails when trying to add a layer once model mutated", () => {
    const layered = simmut.layered();
    layered.set("foo", "bar");
    expect(() => {
      layered.addLayer(null, { foo: "bar" });
    }).toThrowError();
    const layered2 = simmut.layered();
    layered2.merge("foo", "bar");
    expect(() => {
      layered2.addLayer(null, { foo: "bar" });
    }).toThrowError();
    layered.set("foo", "bar2");
    expect(layered.get()).toEqual({ foo: "bar2" });
    layered.merge("test", "testValue");
    expect(layered.get()).toEqual({ foo: "bar2", test: "testValue" });
  });
});

describe("events", () => {
  it("triggers change event", () => {
    const model = simmut.instance();
    const changeHandler = jest.fn(() => null);
    model.on("change", changeHandler);
    model.set("foo", "bar");
    model.merge("foo", "bar");
    model.del("foo");
    expect(changeHandler).toHaveBeenCalledTimes(3);
  });
  it("does not trigger change event after off", () => {
    const model = simmut.instance();
    const changeHandler = jest.fn(() => null);
    model.on("change", changeHandler);
    model.off("change", changeHandler);
    expect(changeHandler).not.toHaveBeenCalled();
  });
});
