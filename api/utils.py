from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta
import logging
import requests
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

logger = logging.getLogger(__name__)

ROUTING_OSRM_BASE_URL = getattr(settings, 'ROUTING_OSRM_BASE_URL', 'https://router.project-osrm.org').rstrip('/')
ROUTING_OSRM_TIMEOUT_SECONDS = int(getattr(settings, 'ROUTING_OSRM_TIMEOUT_SECONDS', 8))
ROUTING_DISTANCE_CACHE_TTL_SECONDS = int(getattr(settings, 'ROUTING_DISTANCE_CACHE_TTL_SECONDS', 1800))
ROUTING_COORD_PRECISION = int(getattr(settings, 'ROUTING_COORD_PRECISION', 5))


def _to_float_coord(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _haversine_distance_km(lat1, lon1, lat2, lon2):
    lat1_f = _to_float_coord(lat1)
    lon1_f = _to_float_coord(lon1)
    lat2_f = _to_float_coord(lat2)
    lon2_f = _to_float_coord(lon2)

    if None in (lat1_f, lon1_f, lat2_f, lon2_f):
        return 0.0

    lat1_rad = math.radians(lat1_f)
    lon1_rad = math.radians(lon1_f)
    lat2_rad = math.radians(lat2_f)
    lon2_rad = math.radians(lon2_f)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return 6371 * c


def _build_route_cache_key(lat1, lon1, lat2, lon2):
    p1 = (round(lat1, ROUTING_COORD_PRECISION), round(lon1, ROUTING_COORD_PRECISION))
    p2 = (round(lat2, ROUTING_COORD_PRECISION), round(lon2, ROUTING_COORD_PRECISION))
    a, b = sorted([p1, p2])
    return f"route_km:{a[0]}:{a[1]}:{b[0]}:{b[1]}"


def calculate_route_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate driving distance (km) from OSRM.
    Returns None when provider cannot be used.
    """
    lat1_f = _to_float_coord(lat1)
    lon1_f = _to_float_coord(lon1)
    lat2_f = _to_float_coord(lat2)
    lon2_f = _to_float_coord(lon2)

    if None in (lat1_f, lon1_f, lat2_f, lon2_f):
        return None

    cache_key = _build_route_cache_key(lat1_f, lon1_f, lat2_f, lon2_f)
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = (
        f"{ROUTING_OSRM_BASE_URL}/route/v1/driving/"
        f"{lon1_f:.7f},{lat1_f:.7f};{lon2_f:.7f},{lat2_f:.7f}"
    )

    try:
        response = requests.get(
            url,
            params={
                'overview': 'false',
                'alternatives': 'false',
                'steps': 'false',
            },
            timeout=ROUTING_OSRM_TIMEOUT_SECONDS,
            headers={'User-Agent': 'FoodDeliveryAseanMall/1.0 (routing-distance)'},
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Routing distance request failed: %s", exc)
        return None

    if data.get('code') != 'Ok':
        logger.warning("Routing provider returned non-OK code: %s", data.get('code'))
        return None

    routes = data.get('routes') or []
    if not routes:
        logger.warning("Routing provider returned no routes")
        return None

    distance_meters = routes[0].get('distance')
    try:
        distance_km = float(distance_meters) / 1000.0
    except (TypeError, ValueError):
        logger.warning("Routing provider returned invalid distance")
        return None

    if distance_km <= 0:
        return None

    cache.set(cache_key, distance_km, ROUTING_DISTANCE_CACHE_TTL_SECONDS)
    return distance_km

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate distance in kilometers.
    Prefer driving route distance, then fallback to straight-line distance.
    """
    route_distance = calculate_route_distance_km(lat1, lon1, lat2, lon2)
    if route_distance is not None:
        return route_distance

    return _haversine_distance_km(lat1, lon1, lat2, lon2)


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
    Calculate delivery fee by distance between restaurant and delivery location.
    """
    if not all([restaurant_lat, restaurant_lon, delivery_lat, delivery_lon]):
        return 0.0
    
    # Calculate distance
    distance_km = calculate_distance_km(
        restaurant_lat, restaurant_lon,
        delivery_lat, delivery_lon
    )
    
    # Calculate fee
    return calculate_delivery_fee(distance_km, settings)


# Multi-restaurant fee now uses the same distance-based flow.


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

