from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from rest_framework import generics
from rest_framework.views import APIView, Response
from rest_framework import viewsets
from mytodolist_app.serializers import *
from mytodolist_app.models import *
from mytodolist_app.schemas import CustomSchema
from mytodolist_app.schemas import GetAuthUserSchema
from rest_framework import parsers
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination

class CreateUser(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginSchema(CustomSchema):
  operation_id = 'login'
  tags = ['auth']
  description = (
    'Login as a given user.  Your login will be stored as part of the session'
  )
  request_serializer = LoginSerializer
  excluded_responses = ['201', '403', '404']
  responses = {
    '401': {'description': 'No matching user found for given login credentials'},
    '200': {
      'description': (
        'Successful login.  Response contains user data for the logged in user.'
      ),
      'content': {'application/json': {'schema': UserSerializer}}
    }
  }

class LoginView(APIView):
  schema = LoginSchema()
  permission_classes = [AllowAny]

  def post(self, request, format=None):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(request, **serializer.validated_data)
    if not user: return Response(status=401) # Could not authenticate
    login(request, user)
    return Response(UserSerializer(user).data)


class LogoutSchema(CustomSchema):
  operation_id = 'logout'
  tags = ['auth']
  empty_request_body = True
  excluded_responses = ['201', '400', '403', '404']
  responses = {
    '200': {
      'description': 'Logged in user is now logged out.'
    }
  }

class LogoutView(APIView):
  schema = LogoutSchema()
  permission_classes=[AllowAny]
  def post(self, request, format=None):
    logout(request)
    return Response()

class CurrentUser(APIView):
    schema = GetAuthUserSchema()
    permission_classes=[AllowAny]
    
    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        else:
            return Response("User is not authenticated", 401)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 3
    page_size_query_param = 'page_size'
    max_page_size = 3 
    
class TodoViews(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    parser_classes = (parsers.MultiPartParser,parsers.FormParser,parsers.JSONParser)
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return Todo.objects.filter(created_by=self.request.user)
