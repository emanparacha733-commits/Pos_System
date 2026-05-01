from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import RegisterView, UserListView, MeView, OwnerSetupView, DeleteUserView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView



class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    path('setup/', OwnerSetupView.as_view(), name='owner-setup'),       # Pehli baar owner banao
    path('register/', RegisterView.as_view(), name='register'),          # Owner naye user banaye
    path('login/', CustomLoginView.as_view(), name='login'),             # Login with role in token
    path('logout/', TokenBlacklistView.as_view(), name='logout'),        # Logout
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/', UserListView.as_view(), name='user-list'),            # Business users list
    path('users/<int:user_id>/delete/', DeleteUserView.as_view(), name='delete-user'),
    path('me/', MeView.as_view(), name='me'),                            # Apni info
]