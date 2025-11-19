from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Order, Restaurant, Product, AnalyticsDaily, 
    RestaurantAnalytics, ProductAnalytics
)


def update_daily_analytics(date=None):
    """Update daily analytics for a specific date or today"""
    if date is None:
        date = timezone.now().date()
    
    # Get or create analytics record for the date
    analytics, created = AnalyticsDaily.objects.get_or_create(date=date)
    
    # Calculate statistics
    orders = Order.objects.filter(order_date__date=date)
    
    analytics.total_orders = orders.count()
    analytics.total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    analytics.completed_orders = orders.filter(current_status='completed').count()
    analytics.cancelled_orders = orders.filter(current_status='cancelled').count()
    
    # Calculate unique customers
    analytics.total_customers = orders.values('user').distinct().count()
    
    # Calculate new customers (first order on this date)
    from accounts.models import User
    new_customer_ids = orders.values_list('user', flat=True).distinct()
    new_customers = 0
    for user_id in new_customer_ids:
        first_order = Order.objects.filter(user_id=user_id).order_by('order_date').first()
        if first_order and first_order.order_date.date() == date:
            new_customers += 1
    analytics.new_customers = new_customers
    
    # Calculate average order value
    if analytics.total_orders > 0:
        analytics.average_order_value = analytics.total_revenue / analytics.total_orders
    else:
        analytics.average_order_value = 0
    
    analytics.save()
    return analytics


def update_restaurant_analytics(restaurant_id, date=None):
    """Update restaurant analytics for a specific date or today"""
    if date is None:
        date = timezone.now().date()
    
    try:
        restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
    except Restaurant.DoesNotExist:
        return None
    
    # Get or create analytics record
    analytics, created = RestaurantAnalytics.objects.get_or_create(
        restaurant=restaurant,
        date=date
    )
    
    # Calculate statistics
    orders = Order.objects.filter(
        restaurant=restaurant,
        order_date__date=date
    )
    
    analytics.total_orders = orders.count()
    analytics.total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    analytics.completed_orders = orders.filter(current_status='completed').count()
    analytics.cancelled_orders = orders.filter(current_status='cancelled').count()
    
    # Calculate average order value
    if analytics.total_orders > 0:
        analytics.average_order_value = analytics.total_revenue / analytics.total_orders
    else:
        analytics.average_order_value = 0
    
    # Count new reviews
    from .models import Review
    analytics.new_reviews = Review.objects.filter(
        restaurant=restaurant,
        review_date__date=date
    ).count()
    
    analytics.save()
    return analytics


def update_product_analytics(product_id, date=None):
    """Update product analytics for a specific date or today"""
    if date is None:
        date = timezone.now().date()
    
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return None
    
    # Get or create analytics record
    analytics, created = ProductAnalytics.objects.get_or_create(
        product=product,
        restaurant=product.restaurant,
        date=date
    )
    
    # Calculate statistics from order details
    from .models import OrderDetail
    order_details = OrderDetail.objects.filter(
        product=product,
        order__order_date__date=date
    ).exclude(order__current_status='cancelled')
    
    analytics.total_ordered = order_details.count()
    analytics.total_quantity = order_details.aggregate(Sum('quantity'))['quantity__sum'] or 0
    analytics.total_revenue = order_details.aggregate(Sum('subtotal'))['subtotal__sum'] or 0
    
    analytics.save()
    return analytics


import math

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """
    คำนวณระยะทางระหว่าง 2 จุด (เป็นกิโลเมตร)
    ใช้ Haversine formula
    """
    # แปลงเป็น radians
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # รัศมีโลก (กิโลเมตร)
    R = 6371
    
    return R * c


def calculate_delivery_fee(distance_km, settings=None):
    """Calculate delivery fee based on distance and settings"""
    if not settings:
        from .models import AppSettings
        settings = AppSettings.get_settings()
    
    if not settings:
        # Fallback values if no settings found
        base_fee = 20.00
        per_km_fee = 5.00
    else:
        # Use settings values, fallback to defaults if None
        base_fee = float(settings.base_delivery_fee) if settings.base_delivery_fee is not None else 20.00
        per_km_fee = float(settings.per_km_fee) if settings.per_km_fee is not None else 5.00
    
    if distance_km <= 2:
        return base_fee
    else:
        return base_fee + ((distance_km - 2) * per_km_fee)


def calculate_delivery_fee_by_distance(
    restaurant_lat, restaurant_lon, 
    delivery_lat, delivery_lon, 
    settings=None
):
    """
    คำนวณค่าจัดส่งตามระยะทางจากร้านไปยังที่อยู่จัดส่ง
    """
    if not all([restaurant_lat, restaurant_lon, delivery_lat, delivery_lon]):
        return 0.0
    
    # คำนวณระยะทาง
    distance_km = calculate_distance_km(
        restaurant_lat, restaurant_lon,
        delivery_lat, delivery_lon
    )
    
    # คำนวณค่าจัดส่ง
    return calculate_delivery_fee(distance_km, settings)


# ไม่ใช้ค่าจัดส่งแบบหลายร้านแล้ว ใช้เฉพาะค่าจัดส่งตามระยะทาง


def estimate_delivery_time(restaurant_id, current_orders_count=None):
    """Estimate delivery time based on restaurant and current orders"""
    base_preparation_time = 20  # Base preparation time in minutes
    per_order_additional = 5  # Additional time per order
    delivery_time = 15  # Average delivery time
    
    if current_orders_count is None:
        # Get current active orders for the restaurant
        current_orders_count = Order.objects.filter(
            restaurant_id=restaurant_id,
            current_status__in=['paid', 'preparing', 'ready_for_pickup']
        ).count()
    
    preparation_time = base_preparation_time + (current_orders_count * per_order_additional)
    total_time = preparation_time + delivery_time
    
    return timezone.now() + timedelta(minutes=total_time)


def send_notification(user, title, message, notification_type='system', related_order=None):
    """Helper function to send notification to user"""
    from .models import Notification
    
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notification_type,
        related_order=related_order
    )
    
    # In production, you would also send push notification, email, SMS, etc.
    # This is just creating database record
    
    return notification 