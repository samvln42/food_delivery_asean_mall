from django.contrib import admin
from django.utils.html import format_html
from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail, Payment,
    Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics, AppSettings, Language, Translation,
    CategoryTranslation, ProductTranslation, GuestOrder, GuestOrderDetail, GuestDeliveryStatusLog,
    Advertisement, RestaurantTable, DineInCart, DineInCartItem, DineInOrder,
    DineInOrderDetail, DineInStatusLog, DineInProduct,
    EntertainmentVenue, VenueImage, VenueCategory,
    Country, City,
)


# UserAdmin moved to accounts app


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'flag_preview', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['sort_order', 'name']
    readonly_fields = ['flag_preview']

    def flag_preview(self, obj):
        if obj.flag:
            return format_html(
                '<img src="{}" width="36" height="24" style="object-fit:cover;border-radius:4px" alt="" />',
                obj.flag.url,
            )
        return '—'

    flag_preview.short_description = 'ธง'


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['name', 'country']
    list_filter = ['country']
    search_fields = ['name', 'country__name']
    ordering = ['country', 'name']


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['restaurant_name', 'user', 'country', 'city', 'is_special', 'status', 'average_rating', 'total_reviews']
    list_filter = ['is_special', 'status', 'created_at']
    search_fields = ['restaurant_name', 'description', 'address']
    readonly_fields = ['average_rating', 'total_reviews', 'created_at', 'updated_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name', 'sort_order', 'is_special_only']
    list_filter = ['is_special_only']
    search_fields = ['category_name']
    list_editable = ['sort_order']
    ordering = ['sort_order', 'category_name']


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


@admin.register(CategoryTranslation)
class CategoryTranslationAdmin(admin.ModelAdmin):
    list_display = ('category', 'language', 'translated_name', 'translated_description')
    list_filter = ('language', 'category')
    search_fields = ('translated_name', 'translated_description', 'category__category_name')
    ordering = ('category', 'language')


@admin.register(ProductTranslation)
class ProductTranslationAdmin(admin.ModelAdmin):
    list_display = ('product', 'language', 'translated_name', 'translated_description')
    list_filter = ('language', 'product__restaurant', 'product__category')
    search_fields = ('translated_name', 'translated_description', 'product__product_name')
    ordering = ('product', 'language')


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


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ['advertisement_id', 'image_thumbnail', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    readonly_fields = ['advertisement_id', 'created_at', 'updated_at', 'image_preview']
    ordering = ['sort_order', '-created_at']
    
    fieldsets = (
        ('รูปภาพโฆษณา', {
            'fields': ('image', 'image_preview')
        }),
        ('การตั้งค่า', {
            'fields': ('sort_order', 'is_active')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('advertisement_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_thumbnail(self, obj):
        """แสดงรูปภาพขนาดเล็กในรายการ"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 50px;"/>',
                obj.image.url
            )
        return '-'
    image_thumbnail.short_description = 'รูปภาพ'
    
    def image_preview(self, obj):
        """แสดงตัวอย่างรูปภาพ"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 800px; max-height: 400px;"/>',
                obj.image.url
            )
        return 'ยังไม่ได้อัปโหลดรูปภาพ'
    image_preview.short_description = 'ตัวอย่างรูปภาพ'


# ===== Dine-In QR Code System Admin =====

@admin.register(DineInProduct)
class DineInProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'restaurant', 'category', 'price', 'is_available', 'sort_order']
    list_filter = ['is_available', 'is_recommended', 'restaurant', 'category']
    search_fields = ['product_name', 'description', 'restaurant__restaurant_name']
    list_editable = ['price', 'is_available', 'sort_order']
    ordering = ['restaurant', 'sort_order', 'product_name']
    readonly_fields = ['dine_in_product_id', 'created_at', 'updated_at']


@admin.register(RestaurantTable)
class RestaurantTableAdmin(admin.ModelAdmin):
    list_display = ['table_number', 'restaurant', 'seats', 'is_active', 'qr_code_thumbnail', 'created_at']
    list_filter = ['is_active', 'restaurant', 'created_at']
    search_fields = ['table_number', 'restaurant__restaurant_name']
    readonly_fields = ['table_id', 'qr_code_data', 'created_at', 'updated_at', 'qr_code_preview']
    ordering = ['restaurant', 'table_number']
    
    fieldsets = (
        ('ข้อมูลโต๊ะ', {
            'fields': ('restaurant', 'table_number', 'seats', 'is_active')
        }),
        ('QR Code', {
            'fields': ('qr_code_data', 'qr_code_image', 'qr_code_image_url', 'qr_code_preview')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('table_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def qr_code_thumbnail(self, obj):
        """แสดง QR Code ขนาดเล็ก"""
        if obj.qr_code_image:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;"/>',
                obj.qr_code_image.url
            )
        return '-'
    qr_code_thumbnail.short_description = 'QR Code'
    
    def qr_code_preview(self, obj):
        """แสดงตัวอย่าง QR Code"""
        if obj.qr_code_image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px;"/>',
                obj.qr_code_image.url
            )
        return 'ยังไม่ได้สร้าง QR Code'
    qr_code_preview.short_description = 'ตัวอย่าง QR Code'


class DineInCartItemInline(admin.TabularInline):
    model = DineInCartItem
    extra = 0
    readonly_fields = ['cart_item_id', 'subtotal']


@admin.register(DineInCart)
class DineInCartAdmin(admin.ModelAdmin):
    list_display = ['cart_id', 'table', 'session_id', 'customer_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'table__restaurant']
    search_fields = ['session_id', 'customer_name', 'table__table_number']
    readonly_fields = ['cart_id', 'created_at', 'updated_at']
    inlines = [DineInCartItemInline]


class DineInOrderDetailInline(admin.TabularInline):
    model = DineInOrderDetail
    extra = 0
    readonly_fields = ['order_detail_id', 'subtotal']


class DineInStatusLogInline(admin.TabularInline):
    model = DineInStatusLog
    extra = 0
    readonly_fields = ['log_id', 'timestamp']


@admin.register(DineInOrder)
class DineInOrderAdmin(admin.ModelAdmin):
    list_display = ['dine_in_order_id', 'table', 'restaurant', 'customer_name', 
                   'total_amount', 'current_status', 'payment_status', 'order_date']
    list_filter = ['current_status', 'payment_status', 'order_date', 'restaurant']
    search_fields = ['dine_in_order_id', 'customer_name', 'table__table_number', 
                    'restaurant__restaurant_name', 'session_id']
    readonly_fields = ['dine_in_order_id', 'order_date', 'paid_at', 'completed_at']
    inlines = [DineInOrderDetailInline, DineInStatusLogInline]
    
    fieldsets = (
        ('ข้อมูลออเดอร์', {
            'fields': ('dine_in_order_id', 'table', 'restaurant', 'session_id', 'order_date')
        }),
        ('ข้อมูลลูกค้า', {
            'fields': ('customer_name', 'customer_count', 'special_instructions')
        }),
        ('การชำระเงิน', {
            'fields': ('total_amount', 'payment_status', 'payment_method', 'paid_at')
        }),
        ('สถานะ', {
            'fields': ('current_status', 'completed_at')
        }),
    )


@admin.register(DineInOrderDetail)
class DineInOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['order_detail_id', 'order', 'dine_in_product', 'quantity', 
                   'price_at_order', 'subtotal']
    list_filter = ['order__current_status', 'order__restaurant']
    search_fields = ['order__dine_in_order_id', 'dine_in_product__product_name']
    readonly_fields = ['order_detail_id', 'subtotal']


@admin.register(DineInStatusLog)
class DineInStatusLogAdmin(admin.ModelAdmin):
    list_display = ['log_id', 'order', 'status', 'timestamp', 'updated_by_user']
    list_filter = ['status', 'timestamp']
    search_fields = ['order__dine_in_order_id', 'note']
    readonly_fields = ['log_id', 'timestamp']


# ===== Entertainment Venues Admin =====

class VenueImageInline(admin.TabularInline):
    """Inline admin for venue images"""
    model = VenueImage
    extra = 0
    fields = ['image', 'image_url', 'caption', 'sort_order', 'is_primary']
    readonly_fields = ['image_id', 'created_at', 'updated_at']


@admin.register(VenueCategory)
class VenueCategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name', 'sort_order', 'is_active', 'venues_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['category_name', 'description']
    list_editable = ['sort_order', 'is_active']
    ordering = ['sort_order', 'category_name']
    readonly_fields = ['category_id', 'created_at', 'updated_at', 'icon_preview']
    
    fieldsets = (
        ('ข้อมูลหมวดหมู่', {
            'fields': ('category_name', 'description', 'icon', 'icon_url', 'icon_preview')
        }),
        ('การตั้งค่า', {
            'fields': ('sort_order', 'is_active')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('category_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def venues_count(self, obj):
        """แสดงจำนวนสถานที่ในหมวดหมู่นี้"""
        return obj.venues.count()
    venues_count.short_description = 'จำนวนสถานที่'
    
    def icon_preview(self, obj):
        """แสดงตัวอย่าง icon"""
        if obj.icon:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;"/>',
                obj.icon.url
            )
        elif obj.icon_url:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;"/>',
                obj.icon_url
            )
        return 'ยังไม่มี icon'
    icon_preview.short_description = 'ตัวอย่าง Icon'


@admin.register(EntertainmentVenue)
class EntertainmentVenueAdmin(admin.ModelAdmin):
    list_display = ['venue_name', 'category', 'status', 'average_rating', 'total_reviews', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['venue_name', 'description', 'address']
    readonly_fields = ['venue_id', 'average_rating', 'total_reviews', 'created_at', 'updated_at', 'image_preview']
    inlines = [VenueImageInline]
    
    fieldsets = (
        ('ข้อมูลสถานที่', {
            'fields': ('venue_name', 'description', 'category', 'status')
        }),
        ('ข้อมูลติดต่อ', {
            'fields': ('address', 'latitude', 'longitude', 'phone_number', 'opening_hours')
        }),
        ('รูปภาพหลัก', {
            'fields': ('image', 'image_url', 'image_preview')
        }),
        ('สถิติ', {
            'fields': ('average_rating', 'total_reviews')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('venue_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """แสดงตัวอย่างรูปภาพ"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px;"/>',
                obj.image.url
            )
        elif obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px;"/>',
                obj.image_url
            )
        return 'ยังไม่มีรูปภาพ'
    image_preview.short_description = 'ตัวอย่างรูปภาพ'


@admin.register(VenueImage)
class VenueImageAdmin(admin.ModelAdmin):
    list_display = ['image_id', 'venue', 'caption', 'sort_order', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at', 'venue']
    search_fields = ['venue__venue_name', 'caption']
    list_editable = ['sort_order', 'is_primary']
    readonly_fields = ['image_id', 'created_at', 'updated_at', 'image_preview']
    ordering = ['venue', 'sort_order', 'created_at']
    
    fieldsets = (
        ('ข้อมูลรูปภาพ', {
            'fields': ('venue', 'image', 'image_url', 'image_preview', 'caption')
        }),
        ('การตั้งค่า', {
            'fields': ('sort_order', 'is_primary')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('image_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """แสดงตัวอย่างรูปภาพ"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px;"/>',
                obj.image.url
            )
        elif obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px;"/>',
                obj.image_url
            )
        return 'ยังไม่มีรูปภาพ'
    image_preview.short_description = 'ตัวอย่างรูปภาพ'