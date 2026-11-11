
from rest_framework.permissions import BasePermission


class IsAdminOrStaff(BasePermission):
    """
    Allow authenticated users who belong to Admin or Staff.
    Superusers always have access.
    """

    message = "You do not have permission to access this feature."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return user.groups.filter(
            name__in=["Admin", "Staff"]
        ).exists()


class IsAdminGroup(BasePermission):
    """
    Allow only Admin group members and superusers.
    """

    message = "Only Admin users can access this feature."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return user.groups.filter(name="Admin").exists()
