const simmut = require('../../simmut');

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