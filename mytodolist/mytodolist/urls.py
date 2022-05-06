from django.contrib import admin
from django.urls import path, include
from rest_framework.schemas import get_schema_view
from mytodolist_app.views import *
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework import routers
from django.conf.urls.static import static
from django.conf import settings
from rest_framework.permissions import AllowAny

django_urls = [
    path('create_user/', CreateUser.as_view(), name='create_user'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('get_auth_user/', CurrentUser.as_view(), name='get_auth_user'),
]

router = routers.SimpleRouter()
router.register(r'todo', TodoViews, basename="todo")
django_urls += router.urls

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('openapi/', get_schema_view(
        title="My TODO List",
        description="API for all things …",
        version="1.0.0",
        renderer_classes=[ JSONRenderer, BrowsableAPIRenderer ],
        permission_classes=[ AllowAny ]
    ), name='openapi-schema'),
    
    path('api/v1/',include(django_urls))
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



