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


def calculate_delivery_fee(distance_km):
    """Calculate delivery fee based on distance"""
    base_fee = 20  # Base fee in THB
    per_km_fee = 5  # Fee per kilometer
    
    if distance_km <= 2:
        return base_fee
    else:
        return base_fee + ((distance_km - 2) * per_km_fee)


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