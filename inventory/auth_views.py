
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.groups.filter(name="Admin").exists():
            role = "Admin"
        elif user.groups.filter(name="Staff").exists():
            role = "Staff"
        else:
            role = "Unassigned"

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
            "is_superuser": user.is_superuser
        })
