from rest_framework.permissions import BasePermission
from .models import UserProfile


def get_role(user):
    try:
        return UserProfile.objects.get(user=user).role
    except UserProfile.DoesNotExist:
        return None


class IsOwner(BasePermission):
    """Sirf Owner access kar sakta hai"""
    def has_permission(self, request, view):
        return get_role(request.user) == 'owner'


class IsOwnerOrManager(BasePermission):
    """Owner ya Manager access kar sakta hai"""
    def has_permission(self, request, view):
        return get_role(request.user) in ['owner', 'manager']


class IsAnyRole(BasePermission):
    """Owner, Manager, Cashier — sab access kar sakte hain"""
    def has_permission(self, request, view):
        return get_role(request.user) in ['owner', 'manager', 'cashier']