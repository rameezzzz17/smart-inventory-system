
from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    Category,
    Product,
    Customer,
    Invoice,
    InvoiceItem
)


# -----------------------------
# REGISTER SERIALIZER
# -----------------------------

class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


# -----------------------------
# CATEGORY SERIALIZER
# -----------------------------

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = '__all__'


# -----------------------------
# PRODUCT SERIALIZER
# -----------------------------

class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = '__all__'

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Product name cannot be empty."
            )
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero."
            )
        return value

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Quantity cannot be negative."
            )
        return value


# -----------------------------
# CUSTOMER SERIALIZER
# -----------------------------

class CustomerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = '__all__'


# -----------------------------
# INVOICE ITEM SERIALIZER
# -----------------------------

class InvoiceItemSerializer(serializers.ModelSerializer):
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = [
            'id',
            'product',
            'quantity',
            'unit_price',
            'line_total'
        ]


# -----------------------------
# INVOICE SERIALIZER
# -----------------------------

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'customer',
            'invoice_number',
            'invoice_date',
            'total_amount',
            'status',
            'payment_method',
            'upi_reference',
            'payment_verified',
            'upi_rejected',
            'upi_rejection_reason',
            'items',
        ]

        read_only_fields = [
            'invoice_number',
            'invoice_date',
            'total_amount',
            'status',
            'upi_reference',
            'payment_verified',
            'upi_rejected',
            'upi_rejection_reason',
        ]


# -----------------------------
# INVOICE ITEM CREATE SERIALIZER
# -----------------------------

class InvoiceItemCreateSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all()
    )

    quantity = serializers.IntegerField(min_value=1)


# -----------------------------
# INVOICE CREATE SERIALIZER
# -----------------------------

class InvoiceCreateSerializer(serializers.Serializer):
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all()
    )

    payment_method = serializers.ChoiceField(
        choices=Invoice.PAYMENT_METHOD_CHOICES,
        default="Cash"
    )

    items = InvoiceItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "Invoice must contain at least one product."
            )

        return value


# -----------------------------
# INVOICE STATUS SERIALIZER
# -----------------------------

class InvoiceStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Invoice
        fields = ['status']

    def validate_status(self, value):
        allowed_statuses = ['Pending', 'Paid', 'Cancelled']

        if value not in allowed_statuses:
            raise serializers.ValidationError(
                "Invalid invoice status."
            )

        return value
