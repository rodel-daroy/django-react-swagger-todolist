from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *
from dataclasses import fields

class CustomUserAdmin(UserAdmin):
    ordering = ['email']
    list_display = ['email', 'first_name', 'last_name']
    search_fields = ('email', 'first_name', 'last_name')
    fieldsets = (
        (None, {
            'fields': ('email', 'password', 'first_name', 'last_name', 'is_active', 'is_staff',  'is_superuser', 'groups', 'user_permissions',)}
        ),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}
        ),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Todo)