import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'materialize-css/dist/css/materialize.min.css';
import {BackendAPIProvider} from './backend-api';
import SwaggerClient from 'swagger-client';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import SwaggerUIPage from './SwaggerUIPage';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import todos from './redux/todos';

import './index.css';

const constructClient = async () => {
  try{ return await SwaggerClient('/openapi/'); }
  catch(err){ console.log(err); }
  return null;
};

const store = createStore(combineReducers({todos: todos, todos2:todos}), composeWithDevTools());

const renderApp = client => ReactDOM.render(
  <React.StrictMode>
	<Provider store={store}>
		<BackendAPIProvider client={client}>
			<BrowserRouter>
				<Switch>
					<Route path="/swagger-ui"><SwaggerUIPage /></Route>
					<Route><App /></Route>
				</Switch>
			</BrowserRouter>
		</BackendAPIProvider>
	</Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

const initApp = async () => renderApp(await constructClient());

initApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
