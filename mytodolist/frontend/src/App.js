import React from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route
} from "react-router-dom";
import Home from './home.js'
import Login from './login.js'
import Signup from './signup.js'
import Todo from './todo.js'
import Auth, { AuthBoundary } from './components/auth.js'

export default function App() {
	return (
		<Auth>
			<Router>
				<Switch>
					<Route path="/home">
						<Home />
					</Route>
					<Route path="/login">
						<Login />
					</Route>
					<Route path="/signup">
						<Signup />
					</Route>
					<Route path="">
						<AuthBoundary>
							<Switch>
								<Route path="/todo">
									<Todo />
								</Route>
							</Switch>
						</AuthBoundary>
						</Route>
					</Switch>
			</Router>
		</Auth>
	);
}

