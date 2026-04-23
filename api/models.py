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


def country_flag_upload_path(instance, filename):
    """Generate upload path for country flag images"""
    import os
    from django.utils.text import slugify

    ext = filename.split('.')[-1] if '.' in filename else 'png'
    base = slugify(instance.name) or f'country_{instance.pk or "new"}'
    pk = instance.pk or 'tmp'
    filename = f'{pk}_{base}.{ext}'
    return os.path.join('countries', 'flags', filename)


class Country(models.Model):
    """ประเทศ (ตารางอ้างอิง — ใช้กับร้านและสถานที่บันเทิง)"""
    country_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    flag = models.ImageField(
        upload_to=country_flag_upload_path,
        blank=True,
        null=True,
        help_text='รูปธงชาติ (แนะนำสัดส่วนใกล้เคียง 4:3 หรือสี่เหลี่ยมจัตุรัส)',
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'countries'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['is_active', 'sort_order']),
        ]

    def __str__(self):
        return self.name


class City(models.Model):
    """เมือง — ผูกกับประเทศหนึ่งประเทศ"""
    city_id = models.AutoField(primary_key=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=120)

    class Meta:
        db_table = 'cities'
        ordering = ['country', 'name']
        constraints = [
            models.UniqueConstraint(fields=['country', 'name'], name='unique_city_name_per_country'),
        ]
        indexes = [
            models.Index(fields=['country']),
        ]

    def __str__(self):
        return f'{self.name}, {self.country.name}'


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
    country = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='restaurants', help_text='Country where the restaurant is located',
    )
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='restaurants', help_text='City where the restaurant is located',
    )
    latitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True, help_text='Restaurant latitude')
    longitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True, help_text='Restaurant longitude')
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
    price = models.DecimalField(max_digits=15, decimal_places=2)
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


# ===== Entertainment Venues Models =====

def venue_image_upload_path(instance, filename):
    """Generate upload path for venue images"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using venue name
    filename = f"{slugify(instance.venue.venue_name)}_{instance.image_id or 'new'}.{ext}"
    return os.path.join('entertainment_venues', str(instance.venue.venue_id), filename)


def venue_category_icon_upload_path(instance, filename):
    """Generate upload path for venue category icons"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using category name
    filename = f"{slugify(instance.category_name)}_icon.{ext}"
    return os.path.join('venue_categories', filename)


class VenueCategory(models.Model):
    """
    หมวดหมู่สถานที่บันเทิง (เช่น คาราโอเกะ, บาร์, โรงภาพยนตร์)
    """
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.ImageField(upload_to=venue_category_icon_upload_path, blank=True, null=True, help_text="Icon for category")
    icon_url = models.CharField(max_length=255, blank=True, null=True, help_text="Icon URL (alternative to icon)")
    sort_order = models.PositiveIntegerField(default=0, help_text="Order for sorting categories")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_categories'
        ordering = ['sort_order', 'category_name']
        indexes = [
            models.Index(fields=['category_name']),
            models.Index(fields=['sort_order']),
            models.Index(fields=['is_active']),
        ]
    
    def get_icon_url(self):
        """Get category icon URL - prioritize uploaded icon over icon_url"""
        if self.icon:
            return self.icon.url
        elif self.icon_url:
            return self.icon_url
        return None
    
    def __str__(self):
        return self.category_name


class EntertainmentVenue(models.Model):
    """
    สถานที่บันเทิง (เช่น คาราโอเกะ, บาร์, โรงภาพยนตร์)
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]
    
    venue_id = models.AutoField(primary_key=True)
    venue_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=500)
    country = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='entertainment_venues', help_text='Country where the venue is located',
    )
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='entertainment_venues', help_text='City where the venue is located',
    )
    latitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True, help_text='Venue latitude')
    longitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True, help_text='Venue longitude')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    opening_hours = models.CharField(max_length=200, blank=True, null=True, help_text="Opening hours (e.g., '18:00 - 02:00')")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    category = models.ForeignKey(VenueCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='venues', help_text="Venue category")
    image = models.ImageField(upload_to='entertainment_venues/', blank=True, null=True, help_text="Main venue image")
    image_url = models.CharField(max_length=255, blank=True, null=True, help_text="Main venue image URL (alternative to image)")
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'entertainment_venues'
        indexes = [
            models.Index(fields=['venue_name']),
            models.Index(fields=['-average_rating']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def get_image_url(self):
        """Get venue image URL - prioritize uploaded image over image_url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    def __str__(self):
        return self.venue_name


class VenueImage(models.Model):
    """
    รูปภาพของสถานที่บันเทิง (Gallery)
    """
    image_id = models.AutoField(primary_key=True)
    venue = models.ForeignKey(EntertainmentVenue, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=venue_image_upload_path, blank=True, null=True, help_text="Venue image")
    image_url = models.CharField(max_length=255, blank=True, null=True, help_text="Venue image URL (alternative to image)")
    caption = models.CharField(max_length=255, blank=True, null=True, help_text="Image caption")
    sort_order = models.PositiveIntegerField(default=0, help_text="Order for sorting images")
    is_primary = models.BooleanField(default=False, help_text="Is this the primary image?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_images'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['venue', 'sort_order']),
            models.Index(fields=['is_primary']),
        ]
    
    def get_image_url(self):
        """Get image URL - prioritize uploaded image over image_url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    def __str__(self):
        return f"Image {self.image_id} for {self.venue.venue_name}"


class VenueTranslation(models.Model):
    venue = models.ForeignKey(EntertainmentVenue, on_delete=models.CASCADE, related_name='translations')
    language = models.ForeignKey('Language', on_delete=models.CASCADE)
    translated_name = models.CharField(max_length=200, blank=True)
    translated_description = models.TextField(blank=True)

    class Meta:
        db_table = 'venue_translations'
        unique_together = ['venue', 'language']

    def __str__(self):
        return f"{self.venue.venue_name} [{self.language.code}]"


class VenueReview(models.Model):
    """
    รีวิวสถานที่บันเทิง
    """
    review_id = models.AutoField(primary_key=True)
    venue = models.ForeignKey(EntertainmentVenue, on_delete=models.CASCADE, related_name='venue_reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venue_reviews')
    rating = models.IntegerField(help_text="Rating from 1 to 5")
    comment = models.TextField(blank=True, null=True, help_text="Review comment")
    review_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_reviews'
        unique_together = [['venue', 'user']]  # One review per user per venue
        indexes = [
            models.Index(fields=['venue', '-review_date']),
            models.Index(fields=['user']),
            models.Index(fields=['rating']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name='venue_rating_range'
            )
        ]
    
    def __str__(self):
        return f"Review for {self.venue.venue_name} by {self.user.username}"


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
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    delivery_address = models.CharField(max_length=500, help_text="additional delivery address")
    delivery_latitude = models.DecimalField(max_digits=20, decimal_places=12, blank=True, null=True)
    delivery_longitude = models.DecimalField(max_digits=20, decimal_places=12, blank=True, null=True)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_fee = models.DecimalField(max_digits=20, decimal_places=5, null=True, blank=True)
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
    price_at_order = models.DecimalField(max_digits=15, decimal_places=2)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    
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
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2)
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
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    rating_restaurant = models.IntegerField()
    comment_restaurant = models.TextField(blank=True, null=True)
    review_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = [['restaurant', 'user']]  # One review per user per restaurant (when order is null)
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


# Signals for updating venue ratings
@receiver(post_save, sender=VenueReview)
def update_venue_rating_on_save(sender, instance, **kwargs):
    venue = instance.venue
    reviews = VenueReview.objects.filter(venue=venue)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
        venue.average_rating = Decimal(str(round(avg_rating, 2)))
        venue.total_reviews = reviews.count()
    else:
        venue.average_rating = Decimal('0.00')
        venue.total_reviews = 0
    
    venue.save()


@receiver(post_delete, sender=VenueReview)
def update_venue_rating_on_delete(sender, instance, **kwargs):
    venue = instance.venue
    reviews = VenueReview.objects.filter(venue=venue)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
        venue.average_rating = Decimal(str(round(avg_rating, 2)))
        venue.total_reviews = reviews.count()
    else:
        venue.average_rating = Decimal('0.00')
        venue.total_reviews = 0
    
    venue.save()


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
    max_delivery_distance = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True, help_text='Maximum delivery distance in km')
    per_km_fee = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True, help_text='Additional fee per kilometer')
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
        settings = cls.objects.first()
        if settings:
            return settings

        # Auto-create singleton settings with model defaults on first access.
        try:
            return cls.objects.create()
        except ValidationError:
            # Handle race conditions where another request created it first.
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


class CategoryTranslation(models.Model):
    """ตารางสำหรับแปลชื่อหมวดหมู่"""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='translations')
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='category_translations')
    translated_name = models.CharField(max_length=100)
    translated_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'category_translations'
        unique_together = ['category', 'language']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['language']),
        ]

    def __str__(self):
        return f"{self.category.category_name} - {self.language.code}: {self.translated_name}"


class ProductTranslation(models.Model):
    """ตารางสำหรับแปลชื่อสินค้า"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='translations')
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='product_translations')
    translated_name = models.CharField(max_length=150)
    translated_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_translations'
        unique_together = ['product', 'language']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['language']),
        ]

    def __str__(self):
        return f"{self.product.product_name} - {self.language.code}: {self.translated_name}"


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
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    delivery_address = models.CharField(max_length=500, help_text="ที่อยู่จัดส่งหลักและรายละเอียดเพิ่มเติม")
    delivery_latitude = models.DecimalField(max_digits=20, decimal_places=12, blank=True, null=True)
    delivery_longitude = models.DecimalField(max_digits=20, decimal_places=12, blank=True, null=True)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_fee = models.DecimalField(max_digits=20, decimal_places=5, null=True, blank=True, help_text="Total delivery fee for all restaurants")
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
    price_at_order = models.DecimalField(max_digits=15, decimal_places=2)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    
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


def advertisement_image_upload_path(instance, filename):
    """Generate upload path for advertisement images"""
    import os
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using advertisement_id
    filename = f"ad_{instance.advertisement_id}.{ext}" if instance.advertisement_id else f"ad_new.{ext}"
    return os.path.join('advertisements', filename)


class Advertisement(models.Model):
    """
    โมเดลสำหรับจัดการโฆษณา/แบนเนอร์ที่แสดงบนหน้าหลัก (เก็บแค่รูปภาพ)
    """
    advertisement_id = models.AutoField(primary_key=True)
    image = models.ImageField(upload_to=advertisement_image_upload_path, help_text="รูปภาพโฆษณา (แนะนำ 800x400px)")
    sort_order = models.PositiveIntegerField(default=0, help_text="ลำดับการแสดงผล (เลขน้อยแสดงก่อน)")
    is_active = models.BooleanField(default=True, help_text="เปิดใช้งานโฆษณา")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'advertisements'
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'sort_order']),
        ]
    
    def get_image_url(self):
        """Get advertisement image URL"""
        if self.image:
            return self.image.url
        return None
    
    def __str__(self):
        return f"Advertisement #{self.advertisement_id} (Order: {self.sort_order})"


# Dine-In QR Code System Models
class RestaurantTable(models.Model):
    """
    โมเดลสำหรับจัดการโต๊ะของร้านอาหาร
    ใช้สำหรับระบบสั่งอาหารกินในร้านผ่าน QR Code
    """
    table_id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    table_number = models.CharField(max_length=20, help_text="หมายเลขโต๊ะ (เช่น A1, B2, 101)")
    qr_code_data = models.CharField(max_length=255, unique=True, help_text="ข้อมูลใน QR Code (unique token)")
    qr_code_image = models.ImageField(upload_to='tables/qr_codes/', blank=True, null=True, help_text="รูป QR Code")
    qr_code_image_url = models.CharField(max_length=500, blank=True, null=True, help_text="URL ของ QR Code")
    is_active = models.BooleanField(default=True, help_text="โต๊ะเปิดใช้งานหรือไม่")
    seats = models.PositiveIntegerField(default=4, help_text="จำนวนที่นั่ง")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'restaurant_tables'
        unique_together = ['restaurant', 'table_number']
        ordering = ['restaurant', 'table_number']
        indexes = [
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['qr_code_data']),
        ]
    
    def __str__(self):
        return f"{self.restaurant.restaurant_name} - Table {self.table_number}"
    
    def save(self, *args, **kwargs):
        # สร้าง QR code data ถ้ายังไม่มี
        if not self.qr_code_data:
            import uuid
            unique_token = uuid.uuid4().hex
            self.qr_code_data = f"DINE-{self.restaurant.restaurant_id}-{self.table_number}-{unique_token}"
        super().save(*args, **kwargs)


class DineInCart(models.Model):
    """
    ตะกร้าสินค้าสำหรับระบบสั่งอาหารกินในร้าน (แยกจากตะกร้าหลักสำหรับ delivery)
    """
    cart_id = models.AutoField(primary_key=True)
    table = models.ForeignKey(RestaurantTable, on_delete=models.CASCADE, related_name='carts')
    session_id = models.CharField(max_length=100, help_text="Session ID สำหรับแยกแต่ละการสั่ง")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, help_text="ตะกร้ายังใช้งานอยู่หรือไม่")
    
    # Optional: เก็บข้อมูลลูกค้าถ้าต้องการ
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'dine_in_carts'
        ordering = ['-created_at']
        unique_together = [('table', 'session_id', 'is_active')]
        indexes = [
            models.Index(fields=['table', 'is_active']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Cart for {self.table} - Session {self.session_id[:8]}"
    
    def get_total(self):
        """คำนวณยอดรวมในตะกร้า"""
        total = sum(item.subtotal for item in self.items.all())
        return total


class DineInCartItem(models.Model):
    """
    รายการสินค้าในตะกร้าสำหรับ Dine-in
    ใช้ DineInProduct แทน Product
    """
    cart_item_id = models.AutoField(primary_key=True)
    cart = models.ForeignKey(DineInCart, on_delete=models.CASCADE, related_name='items')
    dine_in_product = models.ForeignKey('DineInProduct', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_add = models.DecimalField(max_digits=15, decimal_places=2, help_text="ราคาขณะเพิ่มลงตะกร้า")
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    special_instructions = models.TextField(blank=True, null=True, help_text="คำขอพิเศษสำหรับรายการนี้")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dine_in_cart_items'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_add
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.dine_in_product.product_name} x{self.quantity}"


class DineInOrder(models.Model):
    """
    ออเดอร์สำหรับการสั่งอาหารกินในร้าน
    แยกจาก Order หลักที่ใช้สำหรับ delivery
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('served', 'Served'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    ]
    
    dine_in_order_id = models.AutoField(primary_key=True)
    table = models.ForeignKey(RestaurantTable, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='dine_in_orders')
    session_id = models.CharField(max_length=100, help_text="Session ID ที่สร้างออเดอร์")
    
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    
    # ข้อมูลลูกค้า (optional)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    customer_count = models.PositiveIntegerField(default=1, help_text="จำนวนลูกค้าที่โต๊ะ")
    special_instructions = models.TextField(blank=True, null=True)
    
    # ข้อมูลการชำระเงิน
    payment_method = models.CharField(max_length=20, blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # ข้อมูลการร้องขอเช็กบิล
    bill_requested = models.BooleanField(default=False, help_text="ลูกค้าร้องขอเช็กบิล")
    bill_requested_at = models.DateTimeField(blank=True, null=True, help_text="เวลาที่ร้องขอเช็กบิล")
    
    class Meta:
        db_table = 'dine_in_orders'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['restaurant', '-order_date']),
            models.Index(fields=['table', '-order_date']),
            models.Index(fields=['current_status']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Dine-in Order #{self.dine_in_order_id} - Table {self.table.table_number}"


class DineInOrderDetail(models.Model):
    """
    รายละเอียดออเดอร์สำหรับ Dine-in
    ใช้ DineInProduct แทน Product
    """
    order_detail_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(DineInOrder, on_delete=models.CASCADE, related_name='order_details')
    dine_in_product = models.ForeignKey('DineInProduct', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price_at_order = models.DecimalField(max_digits=15, decimal_places=2)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    special_instructions = models.TextField(blank=True, null=True)
    
    # สถานะการเสิร์ฟแต่ละรายการ
    is_served = models.BooleanField(default=False, help_text="Has this item been served?")
    served_at = models.DateTimeField(blank=True, null=True, help_text="Time when this item was served")
    served_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='served_order_details', help_text="พนักงานที่เสิร์ฟ")
    
    class Meta:
        db_table = 'dine_in_order_details'
    
    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_order
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Dine-in Order #{self.order.dine_in_order_id} - {self.dine_in_product.product_name}"


class DineInStatusLog(models.Model):
    """
    บันทึกการเปลี่ยนสถานะของ Dine-in Order
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('served', 'Served'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    log_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(DineInOrder, on_delete=models.CASCADE, related_name='status_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    updated_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'dine_in_status_log'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Status Log for Dine-in Order #{self.order.dine_in_order_id}"


def dine_in_product_image_upload_path(instance, filename):
    """Generate upload path for dine-in product images"""
    import os
    from django.utils.text import slugify
    
    # Get file extension
    ext = filename.split('.')[-1]
    # Create filename using restaurant and product name
    filename = f"{slugify(instance.restaurant.restaurant_name)}_{slugify(instance.product_name)}_dinein.{ext}"
    return os.path.join('dine_in_products', str(instance.restaurant.restaurant_id), filename)


class DineInProduct(models.Model):
    """
    สินค้าสำหรับขายในร้าน (Dine-in)
    แยกจาก Product ของระบบ Delivery
    ร้านอาหารจัดการเอง แอดมินไม่เกี่ยวข้อง
    """
    dine_in_product_id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='dine_in_products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='dine_in_products')
    product_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=15, decimal_places=2, help_text="ราคาสำหรับขายในร้าน")
    image_url = models.CharField(max_length=255, blank=True, null=True)
    image = models.ImageField(upload_to=dine_in_product_image_upload_path, blank=True, null=True, help_text="รูปสินค้า Dine-in")
    is_available = models.BooleanField(default=True, help_text="พร้อมขายหรือไม่")
    sort_order = models.PositiveIntegerField(default=0, help_text="ลำดับการแสดงในเมนู")
    is_recommended = models.BooleanField(default=False, help_text="เมนูแนะนำ")
    preparation_time = models.PositiveIntegerField(null=True, blank=True, help_text="เวลาในการเตรียม (นาที)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dine_in_products'
        ordering = ['sort_order', 'product_name']
        indexes = [
            models.Index(fields=['restaurant', 'is_available']),
            models.Index(fields=['category']),
            models.Index(fields=['sort_order']),
        ]
    
    def get_image_url(self):
        """Get image URL - prioritize uploaded image over image_url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    def __str__(self):
        return f"{self.product_name} (Dine-in - {self.restaurant.restaurant_name})"


class DineInProductTranslation(models.Model):
    """Translations for dine-in product name/description by language."""
    dine_in_product = models.ForeignKey(DineInProduct, on_delete=models.CASCADE, related_name='translations')
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='dine_in_product_translations')
    translated_name = models.CharField(max_length=150)
    translated_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dine_in_product_translations'
        unique_together = ['dine_in_product', 'language']
        indexes = [
            models.Index(fields=['dine_in_product']),
            models.Index(fields=['language']),
        ]

    def __str__(self):
        return f"{self.dine_in_product.product_name} - {self.language.code}: {self.translated_name}"
