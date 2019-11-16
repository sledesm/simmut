# Immut 

## Immutability extremely lightweight and simple


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

The idea of `immut` is that you have a sealed model and two functions: get & set. Internally, information is stored as a regular javascript object, but whenever you set a value in a path, the full branch it belongs to are new objects, and untouched parts are left the same (thus allowing to have cached selectors based on references)

Composing models can be done by passing a modified `set` & `get` function around so that a prefix is appended (to create model slices).

Example of composing a model

```

// todoManager deals with a slice of the model

const instanceTodoManager=({get,set,del}) => {
    const addToDo=(todo)=>{
        todos=get('list')||[];
        todos.push(todo);
        set('list',todos);
    }

    const getToDos=()=>{
        return get('list');
    }

    return {
        addToDo,
        getToDos,
    }
}

// The app architect creates the model for the full app

const instanceArchitect = () => {
    const _model=instanceImmutableModel();
    const _todoManager=instanceTodoManager({
        get:(path)=>_model.get(`todo.${path}`),
        set:(path,value,cloneValue) => _model.set(`todo.${path}`,value,cloneValue),
        del:(path) => _model.del(`todo.${path}`),
    })

    return {
        getTodoManager:()=>_todoManager,
    }
}


```

