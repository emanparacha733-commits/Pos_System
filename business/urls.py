from django.urls import path
from .views import BusinessListCreateView, BusinessDetailView, PublicBusinessView

urlpatterns = [
    path('', BusinessListCreateView.as_view(), name='business-list'),
    path('<int:pk>/', BusinessDetailView.as_view(), name='business-detail'),
    path('public/', PublicBusinessView.as_view(), name='public-business'),
]