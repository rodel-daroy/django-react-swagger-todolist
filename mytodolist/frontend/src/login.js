import React from "react";
import {withRouter} from "react-router-dom";
import BaseTemplate from './base_template.js';
import { Form, Field } from 'react-final-form';
import { Button, Card, Row, Col } from 'react-materialize';
import { useBackendFunc } from './backend-api';
import { FORM_ERROR } from 'final-form'
import { AuthContext } from './components/auth';

function Login(props) {
	const login = useBackendFunc().auth.login;
	const authContext = React.useContext(AuthContext);
	if(authContext.data){
		props.history.push('/todo');
		return <div/>;
	}
	
	return (
	<BaseTemplate>
		<Form
			onSubmit={
				async (values) => {
					try{ 
							await login({requestBody: values})
							authContext.refresh()
						}
					catch(e){
						return({[FORM_ERROR]: "Error logging in"});
					}
				}
			}
			render={({handleSubmit, form, values, submitError}) => {
				return (
				<>
					<form onSubmit={handleSubmit}>
						<Row>
							<Col s={4} offset="s4">
								<Card>
									<h4>Log In</h4>
									
									<div>{submitError}</div>
									
									<label for="email">Email</label>
									<Field name="email" component="input" type="email"/>
									<label for="password">Password</label>
									<Field name="password" component="input" type="password"/>
									
									<Button>Submit</Button>
								</Card>
							</Col>
						</Row>
					</form>
				</>
			)}
			}
		/>
	</BaseTemplate>
  );
}
export default withRouter(Login)