from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.AuthViewSet.as_view({'post': 'register'}), name='auth-register'),
    path('auth/login/', views.AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('auth/logout/', views.AuthViewSet.as_view({'post': 'logout'}), name='auth-logout'),
    path('auth/me/', views.AuthViewSet.as_view({'get': 'me'}), name='auth-me'),
    path('auth/change-password/', views.AuthViewSet.as_view({'post': 'change_password'}), name='auth-change-password'),
    path('auth/reset-password/', views.AuthViewSet.as_view({'post': 'reset_password'}), name='auth-reset-password'),
    path('auth/reset-password-confirm/', views.AuthViewSet.as_view({'post': 'reset_password_confirm'}), name='auth-reset-password-confirm'),
    path('auth/verify-email/', views.AuthViewSet.as_view({'post': 'verify_email'}), name='auth-verify-email'),
    path('auth/resend-verification/', views.AuthViewSet.as_view({'post': 'resend_verification'}), name='auth-resend-verification'),
] 