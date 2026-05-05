from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Business
from .serializers import BusinessSerializer


class BusinessListCreateView(generics.ListCreateAPIView):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]


# ✅ Public endpoint — store ke liye
class PublicBusinessView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        business = Business.objects.first()
        if business:
            serializer = BusinessSerializer(business)
            return Response(serializer.data)
        return Response({'name': 'Our Store', 'address': ''})