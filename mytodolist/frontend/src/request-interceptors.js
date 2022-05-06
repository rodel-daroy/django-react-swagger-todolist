import { getCookie } from './utils';

export const composeInterceptors = (...fns) => args =>
    fns.reduce((arg, fn) => arg.then(fn), Promise.resolve(args));

export const addCSRFTokenToUnsafeRequests = request => {
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if(request.method && unsafeMethods.includes(request.method.toUpperCase()))
        request.headers['X-CSRFToken'] = getCookie('csrftoken');
    return request;
};
