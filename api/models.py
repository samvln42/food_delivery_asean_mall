from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from accounts.models import User  # Import User from accounts app
from django.core.exceptions import ValidationError


def restaurant_image_upload_path(instance, filename):
    """Generate upload path for restaurant images"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using restaurant name
    filename = f"{slugify(instance.restaurant_name)}_restaurant.{ext}"
    return os.path.join('restaurants', str(instance.restaurant_id), filename)


def product_image_upload_path(instance, filename):
    """Generate upload path for product images"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using restaurant and product name
    filename = f"{slugify(instance.restaurant.restaurant_name)}_{slugify(instance.product_name)}.{ext}"
    return os.path.join('products', str(instance.restaurant.restaurant_id), filename)

def category_image_upload_path(instance, filename):
    """Generate upload path for category images"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using category name
    filename = f"{slugify(instance.category_name)}.{ext}"
    return os.path.join('categories', filename)


class Restaurant(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]
    
    restaurant_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='restaurant')
    restaurant_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_special = models.BooleanField(default=False)
    opening_hours = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    image = models.ImageField(upload_to=restaurant_image_upload_path, blank=True, null=True, help_text="Restaurant front image")
    image_url = models.CharField(max_length=255, blank=True, null=True, help_text="Restaurant image URL")
    qr_code_image_url = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_name = models.CharField(max_length=100, blank=True, null=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'restaurants'
        indexes = [
            models.Index(fields=['restaurant_name']),
            models.Index(fields=['-average_rating']),
        ]
    
    def get_image_url(self):
        """Get restaurant image URL - prioritize uploaded image over image_url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    def __str__(self):
        return self.restaurant_name


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True, help_text="Category description")
    image = models.ImageField(upload_to=category_image_upload_path, blank=True, null=True, help_text="Category image")
    is_special_only = models.BooleanField(default=False, help_text="Only special restaurants can use this category")
    sort_order = models.PositiveIntegerField(default=0, unique=True, help_text="Order for sorting categories")
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'category_name']
    
    def get_image_url(self):
        """Get category image URL"""
        if self.image:
            return self.image.url
        return None
    
    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    product_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True, help_text="Upload product image")
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['product_name']),
            models.Index(fields=['restaurant', 'is_available']),
        ]
    
    def get_image_url(self):
        """Get image URL - prioritize uploaded image over image_url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    def __str__(self):
        return self.product_name


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('delivering', 'Delivering'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.CharField(max_length=255)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    delivery_longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(blank=True, null=True)
    is_reviewed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['user', '-order_date']),
            models.Index(fields=['restaurant', '-order_date']),
            models.Index(fields=['current_status']),
        ]
    
    def __str__(self):
        return f"Order #{self.order_id}"


class OrderDetail(models.Model):
    order_detail_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_details')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'order_details'
    
    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_order
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.order.order_id} - {self.product.product_name}"


def payment_proof_upload_path(instance, filename):
    """Generate upload path for payment proof"""
    return f'payments/proofs/{instance.order.order_id}/{filename}'

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('qr_payment', 'QR Payment'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    payment_id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_date = models.DateTimeField(auto_now_add=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    proof_of_payment_url = models.CharField(max_length=255, blank=True, null=True)
    proof_of_payment = models.ImageField(upload_to=payment_proof_upload_path, null=True, blank=True, help_text='Payment proof document')
    
    class Meta:
        db_table = 'payments'
    
    def get_proof_of_payment_url(self):
        """Get proof of payment URL with fallback"""
        if self.proof_of_payment:
            return self.proof_of_payment.url
        return self.proof_of_payment_url
    
    def __str__(self):
        return f"Payment for Order #{self.order.order_id}"


class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    rating_restaurant = models.IntegerField()
    comment_restaurant = models.TextField(blank=True, null=True)
    review_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reviews'
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating_restaurant__gte=1) & models.Q(rating_restaurant__lte=5),
                name='rating_restaurant_range'
            )
        ]
    
    def __str__(self):
        return f"Review for {self.restaurant.restaurant_name} by {self.user.username}"


class ProductReview(models.Model):
    product_review_id = models.AutoField(primary_key=True)
    order_detail = models.OneToOneField(OrderDetail, on_delete=models.CASCADE, related_name='product_review')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating_product = models.IntegerField()
    comment_product = models.TextField(blank=True, null=True)
    review_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_reviews'
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating_product__gte=1) & models.Q(rating_product__lte=5),
                name='rating_product_range'
            )
        ]
    
    def __str__(self):
        return f"Review for {self.product.product_name} by {self.user.username}"


class DeliveryStatusLog(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('delivering', 'Delivering'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    log_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    updated_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'delivery_status_log'
    
    def __str__(self):
        return f"Status Log for Order #{self.order.order_id}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('order', 'Order'),
        ('guest_order', 'Guest Order'),
        ('payment_confirm', 'Payment Confirmation'),
        ('review_reminder', 'Review Reminder'),
        ('promotion', 'Promotion'),
        ('system', 'System'),
        ('new_restaurant_registration', 'New Restaurant Registration'),
        ('upgrade', 'Account Upgrade'),
        ('downgrade', 'Account Downgrade'),
    ]
    
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    related_order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True)
    related_guest_order = models.ForeignKey('GuestOrder', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"


class SearchHistory(models.Model):
    SEARCH_TYPE_CHOICES = [
        ('restaurant', 'Restaurant'),
        ('product', 'Product'),
        ('category', 'Category'),
    ]
    
    search_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_history')
    search_query = models.CharField(max_length=255)
    search_type = models.CharField(max_length=20, choices=SEARCH_TYPE_CHOICES)
    results_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_history'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['search_query']),
        ]
    
    def __str__(self):
        return f"{self.user.username} searched for: {self.search_query}"


class PopularSearch(models.Model):
    popular_search_id = models.AutoField(primary_key=True)
    search_query = models.CharField(max_length=255, unique=True)
    search_count = models.IntegerField(default=1)
    last_searched = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'popular_searches'
    
    def __str__(self):
        return f"{self.search_query} ({self.search_count} searches)"


class UserFavorite(models.Model):
    FAVORITE_TYPE_CHOICES = [
        ('restaurant', 'Restaurant'),
        ('product', 'Product'),
    ]
    
    favorite_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    favorite_type = models.CharField(max_length=20, choices=FAVORITE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_favorites'
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(favorite_type='restaurant', restaurant__isnull=False, product__isnull=True) |
                    models.Q(favorite_type='product', product__isnull=False, restaurant__isnull=True)
                ),
                name='favorite_type_constraint'
            )
        ]
    
    def __str__(self):
        if self.favorite_type == 'restaurant':
            return f"{self.user.username} favorites {self.restaurant.restaurant_name}"
        else:
            return f"{self.user.username} favorites {self.product.product_name}"


class AnalyticsDaily(models.Model):
    analytics_id = models.AutoField(primary_key=True)
    date = models.DateField(unique=True)
    total_orders = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_customers = models.IntegerField(default=0)
    new_customers = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    cancelled_orders = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_daily'
        indexes = [
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.date}"


class RestaurantAnalytics(models.Model):
    restaurant_analytics_id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    total_orders = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    completed_orders = models.IntegerField(default=0)
    cancelled_orders = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    new_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'restaurant_analytics'
        unique_together = ['restaurant', 'date']
        indexes = [
            models.Index(fields=['restaurant', '-date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.restaurant.restaurant_name} on {self.date}"


class ProductAnalytics(models.Model):
    product_analytics_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='analytics')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    date = models.DateField()
    total_ordered = models.IntegerField(default=0)
    total_quantity = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_analytics'
        unique_together = ['product', 'date']
        indexes = [
            models.Index(fields=['product', '-date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.product.product_name} on {self.date}"


# Signals for updating restaurant ratings
@receiver(post_save, sender=Review)
def update_restaurant_rating_on_save(sender, instance, **kwargs):
    restaurant = instance.restaurant
    reviews = Review.objects.filter(restaurant=restaurant)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(models.Avg('rating_restaurant'))['rating_restaurant__avg']
        restaurant.average_rating = Decimal(str(round(avg_rating, 2)))
        restaurant.total_reviews = reviews.count()
    else:
        restaurant.average_rating = Decimal('0.00')
        restaurant.total_reviews = 0
    
    restaurant.save()


@receiver(post_delete, sender=Review)
def update_restaurant_rating_on_delete(sender, instance, **kwargs):
    restaurant = instance.restaurant
    reviews = Review.objects.filter(restaurant=restaurant)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(models.Avg('rating_restaurant'))['rating_restaurant__avg']
        restaurant.average_rating = Decimal(str(round(avg_rating, 2)))
        restaurant.total_reviews = reviews.count()
    else:
        restaurant.average_rating = Decimal('0.00')
        restaurant.total_reviews = 0
    
    restaurant.save()


class AppSettings(models.Model):
    # Basic Information
    app_name = models.CharField(max_length=100, default='Food Delivery')
    app_description = models.TextField(default='Online Food Delivery System', blank=True)
    app_logo = models.ImageField(upload_to='app/logos/', null=True, blank=True)
    app_banner = models.ImageField(upload_to='app/banners/', null=True, blank=True)
    
    # Contact Information
    contact_email = models.EmailField(default='support@fooddelivery.com', blank=True)
    contact_phone = models.CharField(max_length=20, default='02-xxx-xxxx', blank=True)
    contact_address = models.TextField(default='123 Sukhumvit Road, Bangkok 10110', blank=True)
    
    # Hero Section
    hero_title = models.CharField(max_length=200, default='Order Food Easily, Delivered to Your Home', blank=True)
    hero_subtitle = models.CharField(max_length=300, default='Choose from premium restaurants, fast, delicious and safe delivery')
    
    # Features
    feature_1_title = models.CharField(max_length=100, default='Fast Delivery')
    feature_1_description = models.CharField(max_length=200, default='Food delivered to you within 30-45 minutes')
    feature_1_icon = models.CharField(max_length=10, default='🚚')
    
    feature_2_title = models.CharField(max_length=100, default='Quality Food')
    feature_2_description = models.CharField(max_length=200, default='Quality restaurants, carefully selected')
    feature_2_icon = models.CharField(max_length=10, default='🍽️')
    
    feature_3_title = models.CharField(max_length=100, default='Easy Payment')
    feature_3_description = models.CharField(max_length=200, default='Multiple payment methods supported')
    feature_3_icon = models.CharField(max_length=10, default='💳')
    
    # Social Media
    facebook_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    
    # SEO
    meta_keywords = models.TextField(blank=True, help_text='Main search keywords (separated by commas)')
    meta_description = models.TextField(blank=True, help_text='SEO description')
    
    # System Settings
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(default='The system is under maintenance, please try again later')
    
    # Regional Settings
    timezone = models.CharField(max_length=50, default='Asia/Bangkok', help_text='System timezone')
    currency = models.CharField(max_length=3, default='THB', help_text='Currency used')
    
    # Payment Settings
    bank_name = models.CharField(max_length=100, blank=True, default='Bank of Thailand', help_text='Bank name')
    bank_account_number = models.CharField(max_length=50, blank=True, help_text='Bank account number')
    bank_account_name = models.CharField(max_length=100, blank=True, help_text='Bank account name')
    qr_code_image = models.ImageField(upload_to='app/payment/', null=True, blank=True, help_text='QR Code image for payment')
    
    # Delivery Settings
    base_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Base delivery fee in THB')
    free_delivery_minimum = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Minimum order amount for free delivery')
    max_delivery_distance = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Maximum delivery distance in km')
    per_km_fee = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Additional fee per kilometer')
    multi_restaurant_base_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Base fee for multi-restaurant orders')
    multi_restaurant_additional_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Additional fee per additional restaurant')
    delivery_time_slots = models.CharField(max_length=100, default='09:00-21:00', help_text='Delivery time slots (e.g., 09:00-21:00)')
    enable_scheduled_delivery = models.BooleanField(default=True, help_text='Enable scheduled delivery option')
    rush_hour_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.50, help_text='Delivery fee multiplier during rush hours')
    weekend_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.20, help_text='Delivery fee multiplier on weekends')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = 'App Settings'
        verbose_name_plural = 'App Settings'
        
    def __str__(self):
        return self.app_name
    
    def save(self, *args, **kwargs):
        # Ensure only one settings record exists
        if not self.pk and AppSettings.objects.exists():
            raise ValidationError('Only one settings record can exist')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        return cls.objects.first()
    
    def get_logo_url(self):
        if self.app_logo:
            return self.app_logo.url
        return None
    
    def get_banner_url(self):
        if self.app_banner:
            return self.app_banner.url
        return None
    
    def get_qr_code_url(self):
        if self.qr_code_image:
            return self.qr_code_image.url
        return None

class Language(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'languages'
        indexes = [
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if self.is_default:
            Language.objects.filter(is_default=True).exclude(id=self.id).update(is_default=False)
        elif not Language.objects.filter(is_default=True).exists():
            self.is_default = True
        super().save(*args, **kwargs)


class Translation(models.Model):
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='translations')
    key = models.CharField(max_length=255)
    value = models.TextField()
    group = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'translations'
        unique_together = ['language', 'key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['group']),
        ]

    def __str__(self):
        return f"{self.language.code}: {self.key}"

# Guest Order
class GuestOrder(models.Model):
    """
    โมเดลสำหรับการสั่งซื้อแบบไม่ต้องล็อกอิน
    ใช้ Temporary ID เพื่อติดตามคำสั่งซื้อ
    รองรับ multi-restaurant orders
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('delivering', 'Delivering'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    guest_order_id = models.AutoField(primary_key=True)
    temporary_id = models.CharField(max_length=50, unique=True, help_text="Temporary ID for guest order tracking")
    
    # รองรับทั้ง single restaurant และ multi-restaurant
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='guest_orders', null=True, blank=True, help_text="For single restaurant orders")
    restaurants = models.JSONField(default=list, blank=True, help_text="For multi-restaurant orders: [{'restaurant_id': 1, 'restaurant_name': 'Restaurant 1', 'delivery_fee': 50.00}, ...]")
    
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.CharField(max_length=255)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    delivery_longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Total delivery fee for all restaurants")
    estimated_delivery_time = models.DateTimeField(blank=True, null=True)
    
    # ข้อมูลลูกค้าแบบไม่ต้องล็อกอิน
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    special_instructions = models.TextField(blank=True, null=True)
    
    # ข้อมูลการชำระเงิน
    payment_method = models.CharField(max_length=20, default='bank_transfer')
    payment_status = models.CharField(max_length=20, default='pending')
    proof_of_payment = models.ImageField(upload_to='payments/guest_proofs/', blank=True, null=True)
    
    # หมดอายุหลังจาก 30 วัน
    expires_at = models.DateTimeField(help_text="Order expires after 30 days")
    
    class Meta:
        db_table = 'guest_orders'
        indexes = [
            models.Index(fields=['temporary_id']),
            models.Index(fields=['restaurant', '-order_date']),
            models.Index(fields=['current_status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Guest Order #{self.guest_order_id} - {self.temporary_id}"
    
    def save(self, *args, **kwargs):
        if not self.temporary_id:
            import uuid
            self.temporary_id = f"GUEST-{uuid.uuid4().hex[:8].upper()}"
        
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=30)
        
        super().save(*args, **kwargs)
    
    @property
    def is_multi_restaurant(self):
        """ตรวจสอบว่าเป็น multi-restaurant order หรือไม่"""
        return len(self.restaurants) > 0
    
    @property
    def restaurant_count(self):
        """จำนวนร้านในออเดอร์"""
        if self.is_multi_restaurant:
            return len(self.restaurants)
        return 1 if self.restaurant else 0
    
    def get_restaurant_names(self):
        """ดึงชื่อร้านทั้งหมด"""
        if self.is_multi_restaurant:
            return [r.get('restaurant_name', '') for r in self.restaurants]
        elif self.restaurant:
            return [self.restaurant.restaurant_name]
        return []
    
    def get_total_delivery_fee(self):
        """คำนวณค่าจัดส่งรวม"""
        if self.is_multi_restaurant:
            return sum(r.get('delivery_fee', 0) for r in self.restaurants)
        return self.delivery_fee or 0


class GuestOrderDetail(models.Model):
    """
    รายละเอียดคำสั่งซื้อสำหรับ Guest Order
    รองรับ multi-restaurant orders
    """
    guest_order_detail_id = models.AutoField(primary_key=True)
    guest_order = models.ForeignKey(GuestOrder, on_delete=models.CASCADE, related_name='order_details')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, help_text="Restaurant for this order detail")
    quantity = models.IntegerField()
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'guest_order_details'
        indexes = [
            models.Index(fields=['guest_order', 'restaurant']),
        ]
    
    def save(self, *args, **kwargs):
        # ถ้าไม่มี restaurant ให้ใช้จาก product
        if not self.restaurant:
            self.restaurant = self.product.restaurant
        self.subtotal = self.quantity * self.price_at_order
        super().save(*args, **kwargs)
    
    def __str__(self):
        restaurant_name = self.restaurant.restaurant_name if self.restaurant else 'Unknown'
        return f"Guest Order #{self.guest_order.guest_order_id} - {self.product.product_name} ({restaurant_name})"


class GuestDeliveryStatusLog(models.Model):
    """
    บันทึกสถานะการจัดส่งสำหรับ Guest Order
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('delivering', 'Delivering'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    log_id = models.AutoField(primary_key=True)
    guest_order = models.ForeignKey(GuestOrder, on_delete=models.CASCADE, related_name='status_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    updated_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'guest_delivery_status_log'
    
    def __str__(self):
        return f"Guest Status Log for Order #{self.guest_order.guest_order_id}"

