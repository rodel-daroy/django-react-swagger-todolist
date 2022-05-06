export const SET_TODOS = 'TODOS/SET_TODOS';
export const ADD_TODOS = 'TODOS/ADD_TODOS';

export default function reducer(state=[], action=null) {
	switch(action.type) {
		case SET_TODOS:
			return action.payload
		case ADD_TODOS:
			return state.concat(action.payload)
		default:
			return state
	}
}

export function setTodos(list=[]) {
	return {type: SET_TODOS, payload: list}
}

export function addTodo(todo={}) {
	return {type: ADD_TODOS, payload: todo}
}
