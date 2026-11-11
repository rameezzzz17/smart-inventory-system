
from io import BytesIO
from uuid import uuid4
from decimal import Decimal

from django.http import HttpResponse
from django.db import transaction
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django.contrib.auth.models import Group

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter

from .models import Category, Product, Customer, Invoice, InvoiceItem

from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CustomerSerializer,
    RegisterSerializer,
    InvoiceCreateSerializer,
    InvoiceSerializer,
    InvoiceStatusSerializer
)

from .pagination import ProductPagination
from .permissions import IsAdminOrStaff, IsAdminGroup


# -----------------------------
# CATEGORY API
# -----------------------------

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrStaff]


# -----------------------------
# PRODUCT API
# -----------------------------

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrStaff]

    filter_backends = [SearchFilter]
    search_fields = ['name']

    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = Product.objects.all()
        category_id = self.request.query_params.get('category')

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        return queryset


# -----------------------------
# USER REGISTRATION API
# -----------------------------

class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            staff_group, created = Group.objects.get_or_create(
                name="Staff"
            )
            user.groups.add(staff_group)

            return Response(
                {
                    "message": "User registered successfully",
                    "user": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# -----------------------------
# CUSTOMER API
# -----------------------------

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrStaff]


# -----------------------------
# CREATE INVOICE API
# -----------------------------

class InvoiceCreateView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        serializer = InvoiceCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        customer = serializer.validated_data['customer']
        items_data = serializer.validated_data['items']
        payment_method = serializer.validated_data['payment_method']

        quantities = {}

        for item in items_data:
            product_id = item['product'].id
            quantities[product_id] = (
                quantities.get(product_id, 0) + item['quantity']
            )

        with transaction.atomic():
            products = Product.objects.select_for_update().filter(
                id__in=quantities.keys()
            ).in_bulk()

            for product_id, quantity in quantities.items():
                product = products.get(product_id)

                if product is None:
                    return Response(
                        {"error": "Product not found."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if product.quantity < quantity:
                    return Response(
                        {
                            "error": (
                                f"Insufficient stock for {product.name}. "
                                f"Available: {product.quantity}, "
                                f"Requested: {quantity}"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            invoice = Invoice.objects.create(
                customer=customer,
                invoice_number=f"INV-{uuid4().hex[:8].upper()}",
                payment_method=payment_method
            )

            total_amount = Decimal('0.00')

            for product_id, quantity in quantities.items():
                product = products[product_id]
                unit_price = product.price

                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )

                total_amount += unit_price * quantity

                product.quantity -= quantity
                product.save(update_fields=['quantity'])

            invoice.total_amount = total_amount
            invoice.save(update_fields=['total_amount'])

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED
        )


# -----------------------------
# INVOICE HISTORY API
# -----------------------------

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.select_related(
        'customer'
    ).prefetch_related(
        'items__product'
    ).all()

    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrStaff]


# -----------------------------
# INVOICE STATUS UPDATE API
# -----------------------------

class InvoiceStatusUpdateView(APIView):
    permission_classes = [IsAdminOrStaff]

    def patch(self, request, pk):
        with transaction.atomic():
            try:
                invoice = Invoice.objects.select_for_update().get(pk=pk)
            except Invoice.DoesNotExist:
                return Response(
                    {"error": "Invoice not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = InvoiceStatusSerializer(
                invoice,
                data=request.data,
                partial=True
            )

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_status = serializer.validated_data['status']

            if invoice.status == "Cancelled":
                return Response(
                    {"error": "Invoice is already cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                new_status == "Paid"
                and invoice.payment_method == "UPI"
                and not invoice.payment_verified
            ):
                return Response(
                    {
                        "error": (
                            "UPI payment must be verified "
                            "before marking as Paid."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.status == "Paid" and new_status == "Cancelled":
                return Response(
                    {
                        "error": (
                            "Paid invoice cannot be cancelled directly."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_status == "Cancelled":
                items = invoice.items.select_related('product').all()

                for item in items:
                    product = Product.objects.select_for_update().get(
                        id=item.product_id
                    )

                    product.quantity += item.quantity
                    product.save(update_fields=['quantity'])

            serializer.save()

        return Response(serializer.data)


# -----------------------------
# UPI TRANSACTION REFERENCE API
# -----------------------------

class UPIReferenceSubmitView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        reference = str(
            request.data.get("upi_reference", "")
        ).strip()

        if not reference:
            return Response(
                {"error": "UPI transaction reference is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(reference) > 100:
            return Response(
                {"error": "Reference must not exceed 100 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                invoice = Invoice.objects.select_for_update().get(pk=pk)
            except Invoice.DoesNotExist:
                return Response(
                    {"error": "Invoice not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if invoice.payment_method != "UPI":
                return Response(
                    {"error": "This invoice does not use UPI payment."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.status != "Pending":
                return Response(
                    {
                        "error": (
                            "Only pending invoices can submit a reference."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.payment_verified:
                return Response(
                    {"error": "Payment is already verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            invoice.upi_reference = reference
            invoice.upi_rejected = False
            invoice.upi_rejection_reason = ""

            invoice.save(
                update_fields=[
                    "upi_reference",
                    "upi_rejected",
                    "upi_rejection_reason"
                ]
            )

        return Response(
            {
                "message": (
                    "UPI reference submitted. "
                    "Awaiting admin verification."
                ),
                "invoice": InvoiceSerializer(invoice).data
            },
            status=status.HTTP_200_OK
        )


# -----------------------------
# ADMIN PENDING UPI INVOICES API
# -----------------------------

class AdminPendingUPIInvoicesView(APIView):
    permission_classes = [IsAdminGroup]

    def get(self, request):
        invoices = Invoice.objects.filter(
            payment_method="UPI",
            status="Pending",
            payment_verified=False,
            upi_rejected=False
        ).exclude(
            upi_reference__isnull=True
        ).exclude(
            upi_reference=""
        ).select_related(
            "customer"
        ).prefetch_related(
            "items__product"
        ).order_by("-invoice_date")

        serializer = InvoiceSerializer(invoices, many=True)

        return Response(serializer.data)


# -----------------------------
# ADMIN UPI PAYMENT VERIFICATION API
# -----------------------------

class UPIAdminVerifyView(APIView):
    permission_classes = [IsAdminGroup]

    def post(self, request, pk):
        if request.data.get("bank_transaction_confirmed") is not True:
            return Response(
                {
                    "error": (
                        "Confirm that the actual bank transaction "
                        "has been checked before verification."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                invoice = Invoice.objects.select_for_update().get(pk=pk)
            except Invoice.DoesNotExist:
                return Response(
                    {"error": "Invoice not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if invoice.payment_method != "UPI":
                return Response(
                    {"error": "This invoice does not use UPI payment."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.status != "Pending":
                return Response(
                    {"error": "Only pending invoices can be verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.payment_verified:
                return Response(
                    {"error": "Payment is already verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.upi_rejected:
                return Response(
                    {
                        "error": (
                            "This UPI reference was rejected. "
                            "Submit a new reference before verification."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not invoice.upi_reference:
                return Response(
                    {
                        "error": (
                            "Customer has not submitted a UPI reference."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            invoice.payment_verified = True
            invoice.status = "Paid"

            invoice.save(
                update_fields=["payment_verified", "status"]
            )

        return Response(
            {
                "message": "UPI payment verified successfully.",
                "invoice": InvoiceSerializer(invoice).data
            },
            status=status.HTTP_200_OK
        )


# -----------------------------
# ADMIN UPI PAYMENT REJECTION API
# -----------------------------

class UPIAdminRejectView(APIView):
    permission_classes = [IsAdminGroup]

    def post(self, request, pk):
        reason = str(
            request.data.get("reason", "")
        ).strip()

        if not reason:
            return Response(
                {"error": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(reason) > 500:
            return Response(
                {
                    "error": (
                        "Rejection reason must not exceed 500 characters."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                invoice = Invoice.objects.select_for_update().get(pk=pk)
            except Invoice.DoesNotExist:
                return Response(
                    {"error": "Invoice not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if invoice.payment_method != "UPI":
                return Response(
                    {"error": "This invoice does not use UPI payment."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.status != "Pending":
                return Response(
                    {"error": "Only pending invoices can be rejected."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.payment_verified:
                return Response(
                    {"error": "Verified payment cannot be rejected."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not invoice.upi_reference:
                return Response(
                    {"error": "No UPI reference has been submitted."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invoice.upi_rejected:
                return Response(
                    {"error": "This UPI reference is already rejected."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            invoice.upi_rejected = True
            invoice.upi_rejection_reason = reason

            invoice.save(
                update_fields=[
                    "upi_rejected",
                    "upi_rejection_reason"
                ]
            )

        return Response(
            {
                "message": "UPI reference rejected successfully.",
                "invoice": InvoiceSerializer(invoice).data
            },
            status=status.HTTP_200_OK
        )


# -----------------------------
# DASHBOARD API
# -----------------------------

class DashboardView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        total_products = Product.objects.count()
        total_customers = Customer.objects.count()
        total_invoices = Invoice.objects.count()

        paid_revenue = Invoice.objects.filter(
            status="Paid"
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        pending_amount = Invoice.objects.filter(
            status="Pending"
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        cancelled_invoices = Invoice.objects.filter(
            status="Cancelled"
        ).count()

        return Response({
            "total_products": total_products,
            "total_customers": total_customers,
            "total_invoices": total_invoices,
            "paid_revenue": paid_revenue,
            "pending_amount": pending_amount,
            "cancelled_invoices": cancelled_invoices
        })


# -----------------------------
# LOW STOCK API
# -----------------------------

class LowStockProductsView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        low_stock_products = Product.objects.filter(
            quantity__lte=10
        )

        products = []

        for product in low_stock_products:
            if product.quantity == 0:
                message = "Out of Stock!"
            elif product.quantity <= 5:
                if product.quantity == 1:
                    message = "Only 1 item left!"
                else:
                    message = f"Only {product.quantity} items left!"
            else:
                message = "Low Stock!"

            products.append({
                "id": product.id,
                "name": product.name,
                "quantity": product.quantity,
                "alert": message
            })

        return Response({
            "count": len(products),
            "products": products
        })


# -----------------------------
# SALES REPORT API - ADMIN ONLY
# -----------------------------

class SalesReportView(APIView):
    permission_classes = [IsAdminGroup]

    def get(self, request):
        total_revenue = Invoice.objects.filter(
            status="Paid"
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        total_paid_orders = Invoice.objects.filter(
            status="Paid"
        ).count()

        pending_amount = Invoice.objects.filter(
            status="Pending"
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        cancelled_orders = Invoice.objects.filter(
            status="Cancelled"
        ).count()

        return Response({
            "total_revenue": total_revenue,
            "total_paid_orders": total_paid_orders,
            "pending_amount": pending_amount,
            "cancelled_orders": cancelled_orders
        })


# -----------------------------
# DAILY SALES REPORT API - ADMIN ONLY
# -----------------------------

class DailySalesReportView(APIView):
    permission_classes = [IsAdminGroup]

    def get(self, request):
        daily_sales = Invoice.objects.filter(
            status="Paid"
        ).annotate(
            date=TruncDate('invoice_date')
        ).values(
            'date'
        ).annotate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id')
        ).order_by('-date')

        return Response(daily_sales)


# -----------------------------
# MONTHLY SALES REPORT API - ADMIN ONLY
# -----------------------------

class MonthlySalesReportView(APIView):
    permission_classes = [IsAdminGroup]

    def get(self, request):
        monthly_sales = Invoice.objects.filter(
            status="Paid"
        ).annotate(
            month=TruncMonth('invoice_date')
        ).values(
            'month'
        ).annotate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id')
        ).order_by('-month')

        return Response(monthly_sales)


# -----------------------------
# INVOICE PDF API
# -----------------------------

class InvoicePDFView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request, pk):
        try:
            invoice = Invoice.objects.select_related(
                'customer'
            ).prefetch_related(
                'items__product'
            ).get(pk=pk)

        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)

        width, height = A4

        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawCentredString(width / 2, height - 50, "INVOICE")

        pdf.setFont("Helvetica", 11)

        pdf.drawString(
            50, height - 100,
            f"Invoice Number: {invoice.invoice_number}"
        )

        pdf.drawString(
            50, height - 120,
            f"Invoice Date: {invoice.invoice_date.strftime('%d-%m-%Y')}"
        )

        pdf.drawString(
            50, height - 140,
            f"Status: {invoice.status}"
        )

        pdf.drawString(
            50, height - 160,
            f"Payment Method: {invoice.payment_method}"
        )

        if invoice.payment_method == "UPI":
            pdf.drawString(
                50, height - 180,
                f"Payment Verified: {'Yes' if invoice.payment_verified else 'No'}"
            )

            if invoice.upi_reference:
                pdf.drawString(
                    50, height - 200,
                    f"UPI Reference: {invoice.upi_reference}"
                )

        customer = invoice.customer

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, height - 240, "Customer Details")

        pdf.setFont("Helvetica", 11)

        pdf.drawString(50, height - 265, f"Name: {customer.name}")
        pdf.drawString(50, height - 285, f"Email: {customer.email}")
        pdf.drawString(50, height - 305, f"Phone: {customer.phone}")
        pdf.drawString(50, height - 325, f"Address: {customer.address}")

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, height - 365, "Invoice Items")

        pdf.setFont("Helvetica-Bold", 10)

        pdf.drawString(50, height - 390, "Product")
        pdf.drawString(250, height - 390, "Quantity")
        pdf.drawString(340, height - 390, "Unit Price")
        pdf.drawString(450, height - 390, "Total")

        pdf.line(50, height - 400, width - 50, height - 400)

        y = height - 420
        pdf.setFont("Helvetica", 10)

        for item in invoice.items.all():
            if y < 100:
                pdf.showPage()
                y = height - 60
                pdf.setFont("Helvetica", 10)

            pdf.drawString(50, y, item.product.name[:30])
            pdf.drawString(250, y, str(item.quantity))
            pdf.drawString(340, y, f"Rs. {item.unit_price}")
            pdf.drawString(450, y, f"Rs. {item.line_total}")

            y -= 25

        y -= 15
        pdf.line(340, y, width - 50, y)

        y -= 25
        pdf.setFont("Helvetica-Bold", 12)

        pdf.drawString(340, y, "Grand Total:")
        pdf.drawString(450, y, f"Rs. {invoice.total_amount}")

        pdf.showPage()
        pdf.save()

        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/pdf'
        )

        response['Content-Disposition'] = (
            f'attachment; filename="{invoice.invoice_number}.pdf"'
        )

        return response
