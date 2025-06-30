from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin to view/edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'admin':
            return True
        
        # Check if object has user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if object has order attribute (for order-related objects)
        if hasattr(obj, 'order'):
            return obj.order.user == request.user
        
        return False


class IsRestaurantOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for restaurant owners or admin.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['special_restaurant', 'general_restaurant', 'admin']
        )
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        # Check if user owns the restaurant
        if hasattr(obj, 'restaurant'):
            return hasattr(request.user, 'restaurant') and obj.restaurant == request.user.restaurant
        
        # For restaurant object itself
        if obj.__class__.__name__ == 'Restaurant':
            return hasattr(request.user, 'restaurant') and obj == request.user.restaurant
        
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit, others can only read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to admin users
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAuthenticatedAndOwner(permissions.BasePermission):
    """
    Allows access only to authenticated users who own the object.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False 