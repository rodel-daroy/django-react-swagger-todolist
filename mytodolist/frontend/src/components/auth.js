import React from "react";
import {Redirect} from "react-router-dom";
import {useBackendState} from '../backend-api';

export const AuthContext = React.createContext(null);

export default function Auth(props) {
	const authUser = useBackendState().api.get_auth_user();
	
	return <AuthContext.Provider value={authUser}>
		{props.children}
	</AuthContext.Provider>;
}

export function AuthBoundary(props) {
	const authUser = React.useContext(AuthContext);
	if(!authUser) return <Redirect to={'/login'}/>;
	return authUser.data ? props.children : <Redirect to={'/login'}/>;
}