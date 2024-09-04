

const TODOS_KEY = "todos";

export const uuid = () => Math.random().toString(36).substr(2, 9);

export function saveTodos(todos) {
  return localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function initializeTodos() {
  let todos = new Array(10)
    .fill(null)
    .reduce(
      (acc, _, index) =>
        Object.assign(acc, { [uuid()]: `Seeded Todo #${index + 1}` }),
      {}
    );
  saveTodos(todos);
  return todos;
}

export function getTodos() {
  let todos = null;
  try {
    // @ts-expect-error OK to throw here since we're catching
    todos = JSON.parse(localStorage.getItem(TODOS_KEY));
  } catch (e) { }
  if (!todos) {
    todos = initializeTodos();
  }
  return todos;
}

export function addTodo(todo) {
  let newTodos = { ...getTodos() };
  newTodos[uuid()] = todo;
  saveTodos(newTodos);
}

export function deleteTodo(id) {
  let newTodos = { ...getTodos() };
  delete newTodos[id];
  saveTodos(newTodos);
}

export function resetTodos() {
  localStorage.removeItem(TODOS_KEY);
  initializeTodos();
}
