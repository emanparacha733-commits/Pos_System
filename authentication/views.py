from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserProfileSerializer, RegisterSerializer
from .permissions import IsOwner, IsOwnerOrManager


# ✅ Pehli baar owner setup karne ke liye (no auth required)
class OwnerSetupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Agar koi bhi owner exist karta hai toh allow mat karo
        if UserProfile.objects.filter(role='owner').exists():
            return Response({'error': 'Owner already exists. Use login.'}, status=400)

        serializer = RegisterSerializer(data={**request.data, 'role': 'owner'})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Owner created successfully'}, status=201)
        return Response(serializer.errors, status=400)


# ✅ Owner naye users (manager/cashier) banata hai
class RegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def post(self, request):
        profile = UserProfile.objects.get(user=request.user)

        # Owner apni business ke liye hi user bana sakta hai
        data = request.data.copy()
        data['business'] = profile.business_id

        # Owner role assign nahi kar sakta doosre ko
        if data.get('role') == 'owner':
            return Response({'error': 'Cannot assign owner role'}, status=400)

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User created successfully'}, status=201)
        return Response(serializer.errors, status=400)


# ✅ Business ke sare users dekhna — sirf Owner/Manager
class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManager]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        profile = UserProfile.objects.get(user=self.request.user)
        return UserProfile.objects.filter(business=profile.business)


# ✅ User delete karna — sirf Owner
class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def delete(self, request, user_id):
        try:
            profile = UserProfile.objects.get(id=user_id)
            owner_profile = UserProfile.objects.get(user=request.user)

            # Sirf apni business ka user delete kar sakta hai
            if profile.business != owner_profile.business:
                return Response({'error': 'Not allowed'}, status=403)

            # Owner khud ko delete nahi kar sakta
            if profile.role == 'owner':
                return Response({'error': 'Cannot delete owner'}, status=400)

            profile.user.delete()
            return Response({'message': 'User deleted'}, status=200)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


# ✅ Apni info dekhna
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'role': profile.role,
                'business_id': profile.business_id,
            })
        except UserProfile.DoesNotExist:
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'role': None,
                'business_id': None,
            })