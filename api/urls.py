from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'restaurants', views.RestaurantViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'guest-orders', views.GuestOrderViewSet, basename='guest-order') # Guest Order
router.register(r'order-details', views.OrderDetailViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'reviews', views.ReviewViewSet)
router.register(r'product-reviews', views.ProductReviewViewSet)
router.register(r'delivery-status-logs', views.DeliveryStatusLogViewSet)
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'favorites', views.UserFavoriteViewSet, basename='favorite')
router.register(r'search-history', views.SearchHistoryViewSet, basename='search-history')
router.register(r'popular-searches', views.PopularSearchViewSet)
router.register(r'app-settings', views.AppSettingsViewSet, basename='app-settings')
router.register(r'languages', views.LanguageViewSet)
router.register(r'translations', views.TranslationViewSet)
router.register(r'advertisements', views.AdvertisementViewSet)

urlpatterns = [
    # Health check endpoint for ALB/ELB
    path('health/', views.health_check, name='health-check'),
    path('', include(router.urls)),
    path('search/', views.SearchViewSet.as_view({'get': 'search'}), name='search'),
    path('search/popular/', views.SearchViewSet.as_view({'get': 'popular'}), name='popular-searches'),
    path('search/history/', views.SearchViewSet.as_view({'get': 'history'}), name='search-history'),
    path('analytics/daily/', views.AnalyticsViewSet.as_view({'get': 'daily'}), name='analytics-daily'),
    path('analytics/restaurant/', views.AnalyticsViewSet.as_view({'get': 'restaurant'}), name='analytics-restaurant'),
    path('analytics/product/', views.AnalyticsViewSet.as_view({'get': 'product'}), name='analytics-product'),
    path('dashboard/admin/', views.DashboardViewSet.as_view({'get': 'admin'}), name='dashboard-admin'),
    path('dashboard/restaurant/', views.DashboardViewSet.as_view({'get': 'restaurant'}), name='dashboard-restaurant'),
    path('dashboard/customer/', views.DashboardViewSet.as_view({'get': 'customer'}), name='dashboard-customer'),
    path('reports/sales/', views.ReportViewSet.as_view({'get': 'sales'}), name='report-sales'),
    path('reports/products/', views.ReportViewSet.as_view({'get': 'products'}), name='report-products'),
    # Delivery fee calculation endpoints
    path('calculate-delivery-fee/', views.calculate_delivery_fee_api, name='calculate-delivery-fee'),
    path('calculate-multi-restaurant-delivery-fee/', views.calculate_multi_restaurant_delivery_fee_api, name='calculate-multi-restaurant-delivery-fee'),
] 