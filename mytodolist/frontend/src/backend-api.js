import React from 'react';
import { objectMap } from './utils';
import { useCompositeState } from './hooks';
import { addCSRFTokenToUnsafeRequests } from './request-interceptors';

const BackendAPIContext = React.createContext(null);

/* A ContextProvider component that makes a swagger client (or similar
 * substitute) available to the hooks below.  Should usually be placed
 * somewhere high in the component tree.  Takes a single prop, client, which
 * should be the swagger client
 * */
export const BackendAPIProvider = ({client, ...props}) =>
    <BackendAPIContext.Provider value={client} {...props} />;

const wrappedBackendFunc = f => async ({params, requestBody, options}) => {
    const _options = { requestBody, ...options };
    _options.requestInterceptor = addCSRFTokenToUnsafeRequests;
    return await f(params, _options);
};

const wrappedBackendState = f => ({params, requestBody, options} = {}) => {
    const [state, setState] = useCompositeState({
        data: null,
        response: null,
        loading: true,
        error: null
    });

    const refresh = React.useCallback(() => {
        setState({ loading: true })
    }, [setState]);

    const loadData = React.useCallback(async () => {
        try{
            const response = await f(params, {
                requestBody,
                ...options,
                requestInterceptor: addCSRFTokenToUnsafeRequests
            });
            setState({ response, data: response.body, loading: false, error: null });
        } catch(error){
            setState({response: error.response, loading: false, error, data: null});
        }
    }, [setState, params, requestBody, options]);

    React.useEffect(() => {
        if(state.loading) loadData();
    }, [state.loading, loadData]);
    
    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        response: state.response,
        refresh
    };
};

//Hooks
//Get a low-level reference to the swagger client, no bells or whistles
export const useBackendClient = () => React.useContext(BackendAPIContext);

/* Access the api's endpoints as async functions.
Functions take an optional object as input, with the following optional fields:
    params: object with key-value pairs for the url params
    requestBody: the body of the request.  Should be json-serializable
    options: additional options for the request to give to the swagger client
Returns the response on success, propagates errors
Useful for calling backend functions in response to user input, like save
buttons, rather than tying it into the component rendering cycle */
export const useBackendFunc = () => {
    const client = useBackendClient();
    return objectMap(client.apis, api => objectMap(api, wrappedBackendFunc));
};

/* Similar to useBackendFunc, but will make the api request on first render,
and store the result in state.  Useful when you have a component that depends
on backend state as part of its rendering cycle, like detail pages, lists,
etc.  Takes the same arguments, and returns an object with the following
properties:
    data: the parsed response body.  Will be null until data is loaded.  Only
        overwritten on successful load
    loading: bool, true if currently waiting on response, false otherwise
    error: an error object if an error occured, null otherwise
    response: the most recent full response object, null if error
    refresh: a no-arg function to trigger a refresh of the data from the backend
*/
export const useBackendState = () => objectMap(useBackendClient().apis, api => objectMap(api, wrappedBackendState));

/* Allows access to the schema objects that the Backend REST API supplies.
 * These are mostly useful for passing into BackendForm (see forms.js)
 * */
export const useBackendSchema = () => useBackendClient().spec.components.schemas;

