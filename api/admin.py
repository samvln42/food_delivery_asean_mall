from django.contrib import admin
from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail,
    Payment, Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics
)


# UserAdmin moved to accounts app


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['restaurant_name', 'user', 'is_special', 'status', 'average_rating', 'total_reviews']
    list_filter = ['is_special', 'status', 'created_at']
    search_fields = ['restaurant_name', 'description', 'address']
    readonly_fields = ['average_rating', 'total_reviews', 'created_at', 'updated_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name']
    search_fields = ['category_name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'restaurant', 'category', 'price', 'is_available']
    list_filter = ['category', 'is_available', 'created_at']
    search_fields = ['product_name', 'description']
    list_editable = ['price', 'is_available']


class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    extra = 0
    readonly_fields = ['subtotal']


class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'restaurant', 'total_amount', 'current_status', 'order_date']
    list_filter = ['current_status', 'order_date', 'is_reviewed']
    search_fields = ['order_id', 'user__username', 'restaurant__restaurant_name']
    readonly_fields = ['order_date', 'total_amount']
    inlines = [OrderDetailInline, PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'order', 'amount_paid', 'payment_method', 'status', 'payment_date']
    list_filter = ['payment_method', 'status', 'payment_date']
    search_fields = ['transaction_id', 'order__order_id']
    readonly_fields = ['payment_date']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['review_id', 'user', 'restaurant', 'rating_restaurant', 'review_date']
    list_filter = ['rating_restaurant', 'review_date']
    search_fields = ['user__username', 'restaurant__restaurant_name', 'comment_restaurant']
    readonly_fields = ['review_date']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product_review_id', 'user', 'product', 'rating_product', 'review_date']
    list_filter = ['rating_product', 'review_date']
    search_fields = ['user__username', 'product__product_name', 'comment_product']
    readonly_fields = ['review_date']


@admin.register(DeliveryStatusLog)
class DeliveryStatusLogAdmin(admin.ModelAdmin):
    list_display = ['log_id', 'order', 'status', 'timestamp', 'updated_by_user']
    list_filter = ['status', 'timestamp']
    search_fields = ['order__order_id', 'note']
    readonly_fields = ['timestamp']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['notification_id', 'user', 'title', 'type', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['search_id', 'user', 'search_query', 'search_type', 'results_count', 'created_at']
    list_filter = ['search_type', 'created_at']
    search_fields = ['user__username', 'search_query']
    readonly_fields = ['created_at']


@admin.register(PopularSearch)
class PopularSearchAdmin(admin.ModelAdmin):
    list_display = ['search_query', 'search_count', 'last_searched']
    ordering = ['-search_count']
    readonly_fields = ['last_searched', 'updated_at']


@admin.register(UserFavorite)
class UserFavoriteAdmin(admin.ModelAdmin):
    list_display = ['favorite_id', 'user', 'favorite_type', 'restaurant', 'product', 'created_at']
    list_filter = ['favorite_type', 'created_at']
    search_fields = ['user__username', 'restaurant__restaurant_name', 'product__product_name']
    readonly_fields = ['created_at']


@admin.register(AnalyticsDaily)
class AnalyticsDailyAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_orders', 'total_revenue', 'total_customers', 'completed_orders']
    list_filter = ['date']
    ordering = ['-date']
    readonly_fields = ['created_at']


@admin.register(RestaurantAnalytics)
class RestaurantAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['restaurant', 'date', 'total_orders', 'total_revenue', 'completed_orders']
    list_filter = ['date', 'restaurant']
    search_fields = ['restaurant__restaurant_name']
    ordering = ['-date']
    readonly_fields = ['created_at']


@admin.register(ProductAnalytics)
class ProductAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['product', 'date', 'total_ordered', 'total_quantity', 'total_revenue']
    list_filter = ['date']
    search_fields = ['product__product_name', 'restaurant__restaurant_name']
    ordering = ['-date']
    readonly_fields = ['created_at']
