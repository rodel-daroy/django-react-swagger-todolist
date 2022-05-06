import BaseTemplate from './base_template.js';
import { Form, Field } from 'react-final-form';
import { Button, Card, Row, Col } from 'react-materialize';
import { useBackendFunc } from './backend-api';

export default function Signup() {
	const createUser = useBackendFunc().api.createUser;
	
  return (
    <BaseTemplate>
		<Form
			onSubmit={
				async (values) => {
					try{ await createUser({requestBody: values}); }
					catch(e){
						return(e.response.body);
					}
				}
			}
			render={({handleSubmit, form, values}) => {
				return (
				<>
					<form onSubmit={handleSubmit}>
						<Row>
							<Col s={4} offset="s4">
								<Card>
									<h4>Sign Up</h4>
									
									<label for="first_name">First Name</label>
									<Field name="first_name" component="input" type="text"/>
									<label for="last_name">Last Name</label>
									<Field name="last_name" component="input" type="text"/>
									<label for="email">Email</label>
									<Field name="email" render={({input, meta})=>{
										return (
											<>
												<pre>{meta.submitError}</pre>
												<input type="email" {...input}/>
											</>
										);
									}}/>
									<label for="password">Password</label>
									<Field name="password" render={({input, meta})=>{
										return (
											<>
												<pre>{meta.submitError}</pre>
												<input type="password" {...input} />
											</>
										);
									}}/>
									
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
