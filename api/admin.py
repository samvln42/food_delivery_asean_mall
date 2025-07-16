from django.contrib import admin
from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail, Payment,
    Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics, AppSettings, Language, Translation,
    GuestOrder, GuestOrderDetail, GuestDeliveryStatusLog
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


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_default', 'is_active')
    list_filter = ('is_default', 'is_active')
    search_fields = ('code', 'name')
    ordering = ('code',)


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ('key', 'language', 'group', 'value')
    list_filter = ('language', 'group')
    search_fields = ('key', 'value')
    ordering = ('language', 'group', 'key')


@admin.register(GuestOrder)
class GuestOrderAdmin(admin.ModelAdmin):
    list_display = ['guest_order_id', 'temporary_id', 'restaurant', 'customer_name',
                   'total_amount', 'current_status', 'order_date', 'expires_at']
    list_filter = ['current_status', 'order_date', 'payment_status', 'expires_at']
    search_fields = ['guest_order_id', 'temporary_id', 'customer_name', 'customer_phone',
                    'restaurant__restaurant_name']
    readonly_fields = ['guest_order_id', 'temporary_id', 'order_date', 'expires_at']
    fieldsets = (
        ('Order Information', {
            'fields': ('guest_order_id', 'temporary_id', 'restaurant', 'order_date', 'expires_at')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'special_instructions')
        }),
        ('Delivery Information', {
            'fields': ('delivery_address', 'delivery_latitude', 'delivery_longitude',
                      'delivery_fee', 'estimated_delivery_time')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'payment_status', 'proof_of_payment', 'total_amount')
        }),
        ('Status', {
            'fields': ('current_status',)
        }),
    )


class GuestOrderDetailInline(admin.TabularInline):
    model = GuestOrderDetail
    extra = 0
    readonly_fields = ['guest_order_detail_id', 'subtotal']


class GuestDeliveryStatusLogInline(admin.TabularInline):
    model = GuestDeliveryStatusLog
    extra = 0
    readonly_fields = ['log_id', 'timestamp']


@admin.register(GuestOrderDetail)
class GuestOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['guest_order_detail_id', 'guest_order', 'product', 'quantity',
                   'price_at_order', 'subtotal']
    list_filter = ['guest_order__current_status']
    search_fields = ['guest_order__temporary_id', 'product__product_name']


@admin.register(GuestDeliveryStatusLog)
class GuestDeliveryStatusLogAdmin(admin.ModelAdmin):
    list_display = ['log_id', 'guest_order', 'status', 'timestamp', 'updated_by_user']
    list_filter = ['status', 'timestamp']
    search_fields = ['guest_order__temporary_id', 'note']
    readonly_fields = ['log_id', 'timestamp']
