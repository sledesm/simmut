# SImmut 

## Immutability extremely lightweight and Simple


```
const m=instanceImmutableModel();
m.set('a.b.c',{'foo':'bar'});
const first=m.get('a');
m.set('a.h.j',{'foo2':'bar2'});
const second=m.get('a');
first===second --> false
first.b===second.b --> true
```

Idea:

Redux and other systems try to use javascript for functional programming, but the issue is that javascript does not support immutability out of the box. Some libraries like immutable try to create "wrappers" around data so that it becomes immutable.

The idea of `simmut` is that you have a sealed model and two functions: get & set. Internally, information is stored as a regular javascript object, but whenever you set a value in a path, the full branch it belongs to are new objects, and untouched parts are left the same (thus allowing to have cached selectors based on references)

Composing models can be done by passing a modified `set` & `get` function around so that a prefix is appended (to create model slices).

Example of composing a model

```

// todoManager deals with a slice of the model

const simmut=require('simmut');

const instanceTodoManager = ({
    get,
    set,
    del,
}) => {
    const addToDo = (todo) => {
        todos = get('list') || [];
        todos.push(todo);
        set('list', todos);
    }

    const getToDos = () => {
        return get('list');
    }

    const delToDo = (index) => {
        del(`list.${index}`);
    }

    return {
        addToDo,
        delToDo,
        getToDos,
    }
}

// The app architect creates the model for the full app

const instanceArchitect = () => {
    const _model = simmut.instance();
    const _todoManager = instanceTodoManager({
        ...simmut.proxy({
            model: _model,
            path: 'todos',
        })
    })

    return {
        getTodoManager: () => _todoManager,
    }
}


cont architect=instanceArchitect();
architect.getTodoManager().addToDo({desc:'write some software today'});

// After code above, the model will be a plain javascript object like:

{
    todos: {
        list: [{desc: 'write some software today'}]
    }

}

```


We we can see above, we switch from composing models by using reducers and reducer composition to passing around get, set and del functions which are composable by changing the path they will use in the model.

The benefit of get and set functions is that, being opaque, allow us to have more complex models and even conditional logic at all levels.

Immutability is achieved as the `set` functions alter the root object and all the relative paths to new objects, while keeping not modified objects untouched. In this regard, the actual model is exactly the same as a traditional redux model - a plain javascript object, and our managers behave exactly the same way as reducers: they work with a slice of the model.

## Advantages

With this approach, we avoid a lot of complexity and boilerplate code associated to redux, and the whole call is traceable. 

On the other hand, it is still possible to compose models using proxies, and we can use caching for selectors as every mutation changes the object as it would in a functional immutable approach.

It is extremely small. Full library is 230 lines of code!!

## Layered models

It allows us to have models where mutations happen on top of layers. 

Please see example below

```
const simmut=require('simmut');

const model=simmut.instance();

model.addLayer({foo:'bar'});
model.addLayer({test:'valueTest'});

model.get(); // --> {foo:'bar',test:'valueTest'}

model.set({foo:'bar2'});

model.get(); // --> {foo:'bar2',test:'valueTest'}

model.del('foo');
// After removing the value in the top layer, the value in the layer below resurfaces
model.get(); // --> {foo:'bar',test:'valueTest'}

```


