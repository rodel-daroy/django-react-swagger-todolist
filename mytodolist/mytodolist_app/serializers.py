from rest_framework import serializers
from mytodolist_app.models import *
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email','password','first_name','last_name','is_active', 'permissions']
        extra_kwargs = {'password': {'write_only': True}, 
                        'is_active': {'read_only': True}}
        
    permissions = serializers.ListField(child=serializers.CharField(), read_only=True, source="get_all_permissions")
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
    def update(self, instance, validated_data):
        if validated_data.get("password"):
            validated_data["password"] = make_password(validated_data["password"])
        return super().update(instance, validated_data)

class LoginSerializer(serializers.Serializer):
  email = serializers.CharField()
  password = serializers.CharField(style={'input_type': 'password'})

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = '__all__'
        extra_kwargs = {'created_by': {'read_only': True}}
        
    def create(self, validated_data):
        todo = Todo.objects.create(**validated_data, created_by=self.context['request'].user)
        return todo
        
