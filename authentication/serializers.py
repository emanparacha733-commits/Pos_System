from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile


# ✅ JWT token mein role aur business add karo
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            profile = UserProfile.objects.get(user=user)
            token['role'] = profile.role
            token['business_id'] = profile.business_id
        except UserProfile.DoesNotExist:
            token['role'] = None
            token['business_id'] = None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        try:
            profile = UserProfile.objects.get(user=self.user)
            data['role'] = profile.role
            data['business_id'] = profile.business_id
        except UserProfile.DoesNotExist:
            data['role'] = None
            data['business_id'] = None
        data['username'] = self.user.username
        data['email'] = self.user.email
        return data


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['owner', 'manager', 'cashier'])
    business = serializers.IntegerField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        UserProfile.objects.create(
            user=user,
            role=validated_data.get('role', 'cashier'),
            business_id=validated_data.get('business', None),
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'role', 'business']