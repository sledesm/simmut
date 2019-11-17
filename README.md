# SImmut 

## Immutability extremely lightweight and Simple


```
const m=simmut.instance();

m.set('a.b.c',{'foo':'bar'});
const first=m.get('a'); // first -> {a:{b:c:{foo:'bar'}}}
first.a=8; // error!. Object is frozen

m.set('a.h.j',{'foo2':'bar2'});
const second=m.get('a');

first===second --> false (every mutation creates a new model)
first.b===second.b --> true (but unchanged objects are not recreated)
```



Idea:

Redux and other systems try to use javascript for functional programming, but the issue is that javascript does not support immutability out of the box. Some libraries like immutable extend the language by creating new data types instead of using plain javascript objects. That adds an important overhead, both to performance and to usage, as objects need to be transformed back and forth from Immutable types to normal javascript objects.

Other systems, like redux, leave up to the programmer the creation of immutable structures, but it is very common to make mistakes and accidentally write where we should not. Another problem is that because we need to have an extensible paradigm, we need to create actions and reducers and combine the reducers so that a new structure is created every time, needing a lot of boilerplate code.

The idea of `simmut` is that we replace a model by a model adapter. In order to mutate the model, you need the adapter, but you can get a reference to the model anytime and use it as a plain javascript object (with the advantage that it will be a frozen object that you cannot change even if you want to).

The general problem with model adapters, is that they are hard to compose. We cannot normally create libraries that work on a "slice" of our model (store in redux terms). Redux forces you to use reducers which will return a new copy of the model every time.

Simmut solves the composition problem in a different way. Instead of passing around the model/store/state, we pass proxied adapters. Therefore, selectors, containers and readonly parts of our application can use standard javascript objects (frozen), and object mutators use proxied model adapters.

Example of composing a model

```

// todoManager deals with a slice of the model

const simmut=require('simmut');

const instanceTodoManager = ({
    model,
}) => {
    const addToDo = (todo) => {
        todos = model.get('list') || [];
        todos.push(todo);
        set('list', todos);
    }

    const getToDos = () => {
        return model.get('list');
    }

    const delToDo = (index) => {
        model.del(`list.${index}`);
    }

    return {
        addToDo,
        delToDo,
        getToDos,
    }
}

// The app architect creates the model for the full app


const instanceArchitect = () => {
    const _rootModel=simmut.instance();
    const _store={
        'todos':simmut.proxy({model:_rootModel,prefix:'todos'}
    }

    const _todoManager = instanceTodoManager({
        model:_store['todos']
    })

    const getModel=(...args)=>_rootModel.get(...args);

    return {
        getTodoManager: () => _todoManager,
        getModel,
    }
}


const architect=instanceArchitect();
const todoManager=architect.getTodoManager();
todoManager.addToDo({desc:'write some software today'});
architect.getModel() --> {
                            todos: {
                                list: [
                                    {desc: 'write some software today'}
                                ]
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


