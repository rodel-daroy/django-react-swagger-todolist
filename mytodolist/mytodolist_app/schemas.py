from inspect import isclass
from rest_framework.serializers import Serializer
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.schemas.utils import is_list_view

class CustomSchema(AutoSchema):
  operation_id = ''
  tags = ['api']
  description = ''
  request_serializer = None
  empty_request_body = False
  responses = {}
  excluded_responses = []

  def __init__(self, *args, **kwargs):
    self.tags = kwargs.pop('tags', self.tags)
    super().__init__(*args, **kwargs)

  def get_tags(self, *args, **kwargs):
    if self.tags: return self.tags
    return super().get_tags(self, *args, **kwargs)

  def get_operation_id(self, *args, **kwargs):
    if self.operation_id: return self.operation_id
    return super().get_operation_id(*args, **kwargs)
  
  def get_operation(self, *args, **kwargs):
    operation = super().get_operation(*args, **kwargs)
    if self.description: operation['description'] = self.description
    return operation

  def get_serializer(self, *args, **kwargs):
    # if self.request_serializer: return self.request_serializer()
    return super().get_serializer(*args, **kwargs)

  def get_components(self, *args, **kwargs):
    components = super().get_components(*args, **kwargs)
    for code, response in self.responses.items():
      if response.get('content'):
        for ct, schemas in response['content'].items():
          if isclass(schemas['schema']) and issubclass(schemas['schema'], Serializer):
            serializer = schemas['schema']()
            component_name = self.get_component_name(serializer)
            components[component_name] = self.map_serializer(serializer)
    if self.request_serializer:
      serializer = self.request_serializer()
      component_name = self.get_component_name(serializer)
      components[component_name] = self.map_serializer(serializer)
    return components

  def get_request_body(self, *args, **kwargs):
    if self.empty_request_body: return {}
    if self.request_serializer:
      return {
        'content': {
          'application/json': {
            'schema': self._get_reference(self.request_serializer())
          }
        }
      }
    return super().get_request_body(*args, **kwargs)

  def get_responses(self, *args, **kwargs):
    responses = super().get_responses(*args, **kwargs)
    responses['400'] = { 'description': (
      'Request was malformed in some way.  Response body may contain more details.'
    )}
    responses['403'] = { 'description': 'Permission check failed' }
    responses['404'] = { 'description': 'Object not found' }
    responses['500'] = { 'description': 'Server error' }
    for code, response in self.responses.items():
      responses[code] = {'description': response.get('description', '')}
      if response.get('content'):
        responses[code]['content'] = {}
        for ct, schemas in response['content'].items():
          responses[code]['content'][ct] = {}
          if isclass(schemas['schema']) and issubclass(schemas['schema'], Serializer):
            ref = self._get_reference(schemas['schema']())
            responses[code]['content'][ct]['schema'] = ref
          else:
            responses[code]['content'][ct]['schema'] = schemas.get('schema', {})
    for code in self.excluded_responses:
      del responses[code]
    return responses

class CustomViewSetSchema(CustomSchema):
    def get_action(self, path, method):
        if is_list_view(path, method, self.view): return 'list'
        method_name = getattr(self.view, 'action', method.lower())
        if method_name not in self.method_mapping:
            return self._to_camel_case(method_name)
        return self.method_mapping[method.lower()]

    def get_object_name(self, path, method):
      return self.get_operation_id_base(path, method, self.get_action(path, method))

    def get_operation(self, path, method):
        operation = super().get_operation(path, method)
        desc = ''
        object_name = self.get_object_name(path, method)
        if method == 'GET':
            desc = f'Retrieve {object_name} by id.'
            if is_list_view(path, method, self.view):
                desc = f'List all {object_name}.'
        if method == 'POST': desc = f'Create a new {object_name}.'
        if method == 'PUT': desc = f'Update an existing {object_name} by id.'
        if method == 'PATCH':
            desc = f'Partially update an existing {object_name} by id.'
        if method == 'DELETE': desc = f'Delete an existing {object_name} by id.'
        operation['description'] = desc
        return operation

    def get_responses(self, path, method):
        responses = super().get_responses(path, method)
        object_name = self.get_object_name(path, method)
        if method == 'GET':
            responses.pop('400', None)
            responses.get('200', {})['description'] = (
                f"Success.  Body contains requested {object_name} data"
            )
            if is_list_view(path, method, self.view):
                responses.pop('404', None)
                responses.get('200', {})['description'] = (
                    f'Success.  Body contains {object_name} list (may be empty)'
                )
        if method == 'POST':
          responses.pop('404', None)
          responses.get('201', {})['description'] = (
            f'Success.  Body contains newly created {object_name}.'
          )
        if method in ['PUT', 'PATCH']:
          responses.get('200', {})['description'] = (
            f'Success.  Body contains updated {object_name}'
          )
        if method == 'DELETE':
          responses.pop('400', None)
          responses.get('204', {})['description'] = (
            f'Success.  {object_name} has been deleted.'
          )
        return responses

class GetAuthUserSchema(CustomSchema):
    operation_id = 'get_auth_user'
    description = ('Retrieve logged in user')
    excluded_responses = ['400', '403']
    