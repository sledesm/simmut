# SImmut 

## Immutability extremely lightweight and Simple


```
const m=simmut.instance();

m.set('a.b.c',{'foo':'bar'});
const first=m.get('a');
console.log(first); // {b:{c:{foo:'bar'}}
console.log(first.b); // {c:{foo:'bar}}
first.b=8; // error!. Object is frozen

m.set('a.h.j',{'foo2':'bar2'});
const second=m.get('a');

first === second --> false (every mutation creates a new model)
first.a === second.a --> false (any path to change is recreated)
first.b === second.b --> true (but unchanged objects are not recreated)
```



## How it works

Immutability is a very important property in modern software development. 
Some systems try to use javascript for functional programming, but the issue is that javascript does not support immutability out of the box. Some libraries like Immutable extend the language by creating new data types instead of using plain javascript objects. That adds an important overhead, both to performance and to usage, as objects need to be transformed back and forth from Immutable types to normal javascript objects.

Other systems, like redux, leave up to the programmer the creation of immutable structures, but it is very common to make mistakes and accidentally write where we should not. Another problem is that because we need to have an extensible paradigm, we need to create actions and reducers and combine the reducers so that a new structure is created every time, needing a lot of boilerplate code.

The idea of `simmut` is that we replace a model by a model adapter. In order to mutate the model, you need the adapter, but you can get a reference to the model anytime and use it as a plain javascript object (with the advantage that it will be a frozen object that you cannot change even if you want to).

## Composing models

The general problem with model adapters, is that they are hard to compose. We cannot normally create libraries that work on a "slice" of our model (store in redux terms). Redux forces you to use reducers which will return a new copy of the model every time, and then compose reducers to create more complex applications.

Simmut solves the composition problem in a different way. Instead of passing around the model/store/state, we pass proxied adapters. Therefore, selectors, containers and readonly parts of our application can use standard javascript objects (frozen), and object mutators use proxied model adapters.

Example of composing a model

```

// todoManager deals with a slice of the model


const instanceTodoManager = ({
    model,
}) => {
    const addToDo = (todo) => {
        todos = model.get('list') || [];
        // Note: We cannot do todos.push(todo) as todos is frozen
        model.set('list', [...todos, todo]);
    }

    const getToDos = () => {
        return model.get('list');
    }

    const delToDo = (index) => {
        const todos = getToDos() || [];
        const newTodos = [
            ...todos.slice(0, index),
            ...todos.slice(index + 1)
        ]
        model.set('list', newTodos);
    }

    return {
        addToDo,
        delToDo,
        getToDos,
    }
}

// The app architect creates the model for the full app


const instanceArchitect = () => {
    const _rootModel = simmut.instance();
    const _store = {
        'todos': simmut.proxy({model: _rootModel, prefix: 'todos'})
    }

    const _todoManager = instanceTodoManager({
        model: _store['todos']
    })

    const getModel = (...args) => _rootModel.get(...args);

    return {
        getTodoManager: () => _todoManager,
        getModel,
    }
}


const architect = instanceArchitect();
const todoManager = architect.getTodoManager();
todoManager.addToDo({desc: 'write some software today'});
todoManager.addToDo({desc: 'and then eat some pizza'});
todoManager.addToDo({desc: 'and clean the house'});
todoManager.delToDo(1);
console.log(JSON.stringify(architect.getModel(), null, 2)); 

// result
{
  "todos": {
    "list": [
      {
        "desc": "write some software today"
      },
      {
        "desc": "and clean the house"
      }
    ]
  }
}

```


We we can see above, we switch from composing models by using reducers and reducer composition to passing around get, set and del functions which are composable by changing the path they will use in the model.

The benefit of get and set functions is that, being opaque, allow us to have more complex models and even conditional logic at all levels.

Immutability is achieved as the `set` functions alter the root object and all the relative paths to new objects, while keeping not modified objects untouched. In this regard, the actual model is exactly the same as a traditional redux model - a plain javascript object, and our managers behave exactly the same way as reducers: they work with a slice of the model.

## Cloning and immutability

An immutable object does not need to be cloned, as it is immutable. Because of this, we can speed up all processes by detecting immutable structures.

To do this, Object.frozen is used.

It is also possible to create circular references in our models using frozen objects, which would not be possible using the standard cloning method.

`Warning`: It is assumed that if an object is frozen at the top level, it will be frozen at all levels, which is not necessarily true. However, if you do not use Object.freeze in your code, you are safe as the only frozen objects will be generated by the simmut library itself and they will be frozen recursively. The easiest way to create frozen objects is to use `simmut.instance(data)`, which will create a frozen immutable structure that you can get later.


```
const model = simmut.instance();
model.set('a.b.c', {value: 'bar'});
const first = model.get();
model.set('d', first.a);
const second = model.get('d');

first === second // false
first.a === second.d; // true --> object is shared as it is immutable
```

## Advantages

With this approach, we avoid a lot of complexity and boilerplate code associated to redux, and the whole call is traceable. 

On the other hand, it is still possible to compose models using proxies, and we can use caching for selectors as every mutation changes the object as it would in a functional immutable approach.

It is extremely small.

## Reacting to changes

`simmut` models emit `change` events that we can use

```
const model=simmut.instance();

model.on('change',updateView)

```

## Layered models

It allows us to have models where mutations happen on top of layers. 

Please see example below

```
const simmut=require('simmut');

// Please note creation of layered model instead of normal model
const model=simmut.layered();

model.addLayer({foo:'bar'});
model.addLayer({test:'valueTest'});

model.get(); // --> {foo:'bar',test:'valueTest'}

model.set({foo:'bar2'});

model.get(); // --> {foo:'bar2',test:'valueTest'}

model.del('foo');
// After removing the value in the top layer, the value in the layer below resurfaces
model.get(); // --> {foo:'bar',test:'valueTest'}

```


