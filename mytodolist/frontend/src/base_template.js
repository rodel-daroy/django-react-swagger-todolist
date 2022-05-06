import React from "react";
import { Link } from "react-router-dom";
import { useBackendFunc } from './backend-api';
import { AuthContext } from './components/auth';
import { Button } from 'react-materialize';


export default function BaseTemplate(props) {
	const logout = useBackendFunc().auth.logout;
	const authContext = React.useContext(AuthContext);
	
	return (
		<div>
			<nav>
				<ul>
					<li>
						<Link to="/home">Home</Link>
					</li>
										
					{ authContext.data ? 
						<>
							<li>
								<Link to="/todo">TODO</Link>
							</li>
							<li>
								<Button onClick={async () => {
										 console.log("here");
											await logout({params:{}})
											authContext.refresh()
											
									}}>Logout</Button>
							</li>
						</>
					: <>
						<li>
							<Link to="/signup">Sign Up</Link>
						</li>
						<li>
							<Link to="/login">Login</Link>
						</li>
					</>}
				</ul>
			</nav>
			{props.children}
		</div>
	);
}
