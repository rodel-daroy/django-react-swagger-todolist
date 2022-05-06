import React, { useEffect } from "react";
import BaseTemplate from './base_template.js'
import { Form, Field } from 'react-final-form';
import { useBackendState, useBackendFunc } from './backend-api';
import { Button, Card, Row, Col, Checkbox } from 'react-materialize';
import { useDispatch, useSelector } from 'react-redux';
import { setTodos, addTodo } from './redux/todos';
import { AuthContext } from './components/auth';

const ADD_TODO = 'mytodolist_app.add_todo';
const DESTROY_TODO = 'mytodolist_app.destroy_todo';

export default function Todo() {
	const dispatch = useDispatch()
	const todos = useSelector((s)=>s.todos)
	
	// Pagination
	const [curPage, setPage] = React.useState(1);
	if(!useBackendState().api.listTodos){
		window.location.reload()
	}
	const todoList = useBackendState().api.listTodos({params: {page: curPage}});
			
	// Load initial data from api / On refresh, check if list has been updated
	useEffect(()=>{dispatch(setTodos(todoList.data))}, [todoList.data, dispatch])
	
	const createTodo = useBackendFunc().api.createTodo;
	const destroyTodo = useBackendFunc().api.destroyTodo;
	const partialUpdateTodo = useBackendFunc().api.partialUpdateTodo;
	
	const [editing, doEdit] = React.useState(0);
	
	const auth = React.useContext(AuthContext);
		
	return (
		<BaseTemplate>
		{!todos ? 
			<>
				Loading...
			</>
		: 
			<Row>
				<Col s={6} offset="s3">
					<Card>
						<h4>TODOs</h4>
						
						<Form onSubmit={
							async (values) => {
								const response = await createTodo({requestBody: values})
								dispatch(addTodo(response.body))
							}
						}
						render={({handleSubmit, form, values, submitError}) => {
							return (
								auth.data.permissions.includes(ADD_TODO) ?
								<form onSubmit={handleSubmit}>
									<Row>
										<Col s={10}>
											<label for="todo_label">Add Todo</label>
											<Field name="todo_label" component="input" type="text"/>
										</Col>
										<Col s={2}>
											<Button>Add</Button>
										</Col>
									</Row>
								</form>:
								<></>
							)}
							}
						/>
						
						<ul class="collection">
							{(todos != null && todos.results != null) ? todos.results.map(
								(i) => 
								<li key={i.id} class="collection-item">
									<table>
										<tr>
											<td style={{width:"20px"}}>
												<Checkbox id={`checkbox${i.id}`} filledIn checked={i.is_complete} value="1" 
												onChange={async (e) => {
														e.stopPropagation();
														await partialUpdateTodo({params:{id: i.id}, requestBody: {is_complete: !i.is_complete}})
														todoList.refresh()
													}} /></td>
											<td>
												{editing === i.id ? 
													<Form onSubmit={
														async (values) => {
															console.log(values.attached_file)
															await partialUpdateTodo({params:{id: i.id}, requestBody: values})
															doEdit(0);
															todoList.refresh()
														}
													}
													initialValues={{todo_label: i.todo_label}}
													render={({handleSubmit, form, values, submitError}) => {
													return (
														<form onSubmit={handleSubmit}>
															<table>
																<tr>
																	<td>
																		<Field name="todo_label" component="input" type="text"/>
																	</td>
																	<td>
																		<Field name="attached_file_name">
																			{({input, meta}) => (
																				<input {...input} type="file" onChange={(e) => {
																					form.batch(() => {
																						input.onChange(e);
																						form.change('attached_file', e.currentTarget.files[0]);
																					})
																				}} />
																			)}
																		</Field>
																	</td>
																	<td>	
																		<i class="material-icons" onClick={() => {
																			form.submit()
																		}}>check</i>
																		<i class="material-icons" onClick={() => {
																			doEdit(0);
																		}}>cancel</i>
																	</td>
																</tr>
															</table>
														</form>)}}/>
												:
													<>
														{i.todo_label}
													</>
												}
											</td>
											<td>
												<div style={{textAlign: 'right'}}>
													{i.attached_file ?
														<a href={i.attached_file}><i class="material-icons">attachment</i></a>
													: <></>}
													
													<i class="material-icons"  onClick={() => {
														doEdit(i.id);
													}}>edit</i>
													
													{auth.data.permissions.includes(DESTROY_TODO) ?
														<i class="material-icons" onClick={async (e) => {
															e.stopPropagation();
															await destroyTodo({params:{id: i.id}})
															todoList.refresh()
														}}>delete</i>:<></>
													}
												</div>
											</td>
										</tr>
									</table>
								</li> 
							):<></>}
						</ul>
						<Button onClick={() => { setPage(curPage-1); todoList.refresh() }}>back</Button>
						<Button onClick={() => { setPage(curPage+1); todoList.refresh() }}>next</Button>
					</Card>
				</Col>
			</Row>
		}
		</BaseTemplate>
	);
}
