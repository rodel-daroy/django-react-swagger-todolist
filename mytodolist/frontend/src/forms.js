import React from 'react';
import dayjs from 'dayjs';
import { Prompt, useHistory } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import { objectMap } from './utils';
import { FORM_ERROR } from 'final-form';
import { useQuery } from './hooks';
import { OnChange } from 'react-final-form-listeners';

const defaultOnSubmit = () => ({ ok: true, status: 200, text: '' });

const defaultPreSubmit = values => ({requestBody: values});

const defaultPostSubmit = (_, values, form) => form.initialize(values);

const defaultOnError = response => {
    const errors = response.body;
    if(response.body && response.body.non_field_errors)
        errors[FORM_ERROR] = response.body.non_field_errors;
    return errors;
};

const initialValuesFromSchema = schema => {
    if(schema) return objectMap(schema.properties, prop => {
        if(prop.default !== undefined) return prop.default;
        if(prop.nullable) return null;
        if(prop.type === 'boolean') return false;
        if(['integer', 'number'].includes(prop.type)) return 0;
        if(prop.type === 'string' && prop.format === 'date')
            return dayjs().format('YYYY-MM-DD');
        if(prop.type === 'string' && prop.format === 'date-time')
            return dayjs().format();
        return '';
    });
};

const inputTypeForField = field => ({
    boolean: 'checkbox',
    integer: 'number',
    number: 'number',
    string: field.format === 'password'
        ? 'password'
        : 'text'
})[field.type];

const fieldsFromSchema = schema => {
    if(!schema) return {};
    return objectMap(schema.properties, (field, name) => ({children, ...props}) =>
        <Field name={name} {...props}>
            {children ? children : ({input, meta}) => (
                <div>
                    {(meta.error || meta.submitError) && (
                        <div className="error">{meta.error || meta.submitError}</div>
                    )}
                    <label htmlFor={name}>{name}: </label>
                    {field.enum ? (
                        <select
                            id={name}
                            required={schema.required.includes(name)}
                            disabled={field.readOnly}
                            {...input}
                        >
                            {field.enum.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={inputTypeForField(field)}
                            id={name}
                            placeholder={field.example ? field.example : name}
                            required={schema.required.includes(name)}
                            disabled={field.readOnly}
                            {...input}
                        />
                    )}
                </div>
            )}
        </Field>
    );
};

/* A BackendForm is a component that 
 *
 * Props:
 *  schema: The 'shape' of the form, used to create default fields and initial
 *    values for empty forms.  Expects a schema object from the useBackendSchema
 *    hook.
 *  initialData: Optional.  A state from a useBackendState function for the
 *    form's initial data.  Useful for editing forms.  While the data is
 *    loading, submission will be disabled.
 *  initialValues: Optional.  An object representing initialValues for the form.
 *    Any values here will be used to override the initialData
 *  onSubmit: A useBackendFunc function to call when the form is submitted.
 *    Will only be called if the form passes any local validation (see
 *    react-final-form docs for more info).  Can be sync or async.
 *  preSubmit: An optional function to be called for transforming the data
 *    before submission.  If provided, this will be called with the current
 *    values, and the form api, before onSubmit, and onSubmit will be passed
 *    the output of this function.  Can be sync or async.
 *  postSubmit: An optional function to be called after successful submission.
 *    If provided, it will be passed the response from onSubmit, the form's
 *    current values, and the form api.  Anything returned from postSubmit will
 *    be disregarded.
 *  onError: An optional function to be called after unsuccessful submission,
 *    either due to network error, bad response, or other such issues.  Will be
 *    passed the response from onSubmit.  Should return an object of error
 *    messages, to be set on the form.  Can be sync or async.
 *  
 *  All other props are passed to the internal <Form /> Component
 * */
export const BackendForm = ({
    schema,
    initialData = null,
    initialValues=null,
    onSubmit = defaultOnSubmit,
    preSubmit = defaultPreSubmit,
    postSubmit = defaultPostSubmit,
    onError = defaultOnError,
    ...props
}) => {
    let _initialValues = initialData ? initialData.data : initialValuesFromSchema(schema);
	_initialValues = {..._initialValues, ...initialValues};
    const loading = initialData && initialData.loading;

    const onFormSubmit = async (values, form) => {
        const params = await Promise.resolve(preSubmit(values, form));
        let response = null;
        try{
            response = await Promise.resolve(onSubmit(params));
        } catch(err){
            return await Promise.resolve(onError(err));
        }
        if(!response.ok) return await Promise.resolve(onError(response));
        postSubmit(response, form.getState().values, form);
    };

    const fields = fieldsFromSchema(schema);
    
    fields.all = Object.values(objectMap(fields, (Field, name) => <Field key={name} />));

    const render = ({render, children, promptWhen, promptMessage}) => props => {
        const handleSubmit = e => {
            e.preventDefault();
            if(!(loading || props.submitting)) return props.handleSubmit();
            return false;
        };
        return (
            <>
                <Prompt
                    when={promptWhen ? promptWhen(props) : props.dirty}
                    message={promptMessage || "You have unsubmitted changes, are you sure you want to leave?"}
                />
                {render ? render({...props, handleSubmit, children, fields, loading})
                : children ? children({...props, handleSubmit, fields, loading})
                : (
                    <form onSubmit={handleSubmit}>
                        {props.error && (
                            <span class="error">{props.error}</span>
                        )}
                        {fields.all}
                        <button type="submit" disabled={loading || props.submitting}>Submit</button>
                    </form>
                )}
            </>
        );
    };

    return <Form
        onSubmit={onFormSubmit}
        initialValues={_initialValues}
        render={render(props)}
        {...props}
    />;
};

const defaultSource = () => ({
    data: null,
    loading: false,
    error: null,
    response: defaultOnSubmit(),
    refresh: () => {}
});

/* A QueryForm is a component that assists in creating forms for filtering,
 * paginating, and sorting some data set from the server.  It wraps a
 * react-final-form Form component, and a useBackendState-type data source, and
 * provides the current data set as a parameter to the rendering function,
 * along with the usual final-form props.  It will also attempt to read its
 * initial state from the url query parameters, and will take care of updating
 * the query string on submission.
 * 
 * Props:
 *  source: A function to be called when fetching new data.  Should be of the
 *    same form as those from the useBackendState hook.
 *  paginated: A boolean indicating whether to fetch new data when the fields
 *    indicated by the pageField or pageSizeField props change.  Defaults to
 *    false.
 *  orderable: A boolean indicating whether to fetch new data when the field
 *    indicated by orderingField changes.  Defaults to false.
 *  pageField: A string indicating which field name to treat as the 'page'
 *    field.  Defaults to 'page'.  See 'paginated' for more info.
 *  pageSizeField: A string indicating which field name to treat as the 'page
 *    size' field.  Defaults to 'page_size'.  See 'paginated' for more info.
 *  orderingField: A string indicating which field name to treat as the
 *    'ordering' field.  Defaults to 'ordering'.  See 'orderable' for more info.
 *  All other props are passed to the internal <Form /> Component
 * */
export const QueryForm = ({
    source=defaultSource,
    paginated=false,
    pageField='page',
    pageSizeField='page_size',
    orderable=false,
    orderingField='ordering',
    ...props
}) => {
    const query = useQuery();
    const history = useHistory();

    const values = Object.fromEntries(query.entries());
    const result = source({params: values});

    const setValues = values => {
        history.push('?' + (new URLSearchParams(values)).toString());
        result.refresh();
    };

    const changePage = page => {
        const params = new URLSearchParams(values);
        params.set(pageField, page);
        history.push('?' + params.toString());
        result.refresh();
    };

    const changePageSize = pageSize => {
        const params = new URLSearchParams(values);
        params.set(pageSizeField, pageSize);
        history.push('?' + params.toString());
        result.refresh();
    };

    const reorder = ordering => {
        const params = new URLSearchParams(values);
        params.set(orderingField, ordering);
        history.push('?' + params.toString());
        result.refresh();
    };

    return <Form
        {...props}
        initialValues={values}
        onSubmit={setValues}
        render={renderProps => (
            <>
                {paginated && (
                    <>
                        <OnChange name={pageField}>{changePage}</OnChange>
                        <OnChange name={pageSizeField}>{changePageSize}</OnChange>
                    </>
                )}
                {orderable && <OnChange name={orderingField}>{reorder}</OnChange>}
                {props.render
                    ? props.render({...renderProps, result})
                    : props.children
                        ? props.children({...renderProps, result})
                        : null}
            </>
        )}
    />;
};

