
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductViewSet,
    CustomerViewSet,
    RegisterView,
    InvoiceCreateView,
    InvoiceViewSet,
    InvoiceStatusUpdateView,
    UPIReferenceSubmitView,
    UPIAdminVerifyView,
    UPIAdminRejectView,
    AdminPendingUPIInvoicesView,
    DashboardView,
    LowStockProductsView,
    SalesReportView,
    DailySalesReportView,
    MonthlySalesReportView,
    InvoicePDFView,
)

from .auth_views import CurrentUserView


router = DefaultRouter()

router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'invoices', InvoiceViewSet, basename='invoice')


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),

    path(
        'invoices/create/',
        InvoiceCreateView.as_view(),
        name='invoice-create'
    ),

    path(
        'invoices/<int:pk>/status/',
        InvoiceStatusUpdateView.as_view(),
        name='invoice-status-update'
    ),

    path(
        'invoices/<int:pk>/upi-reference/',
        UPIReferenceSubmitView.as_view(),
        name='upi-reference-submit'
    ),

    path(
        'admin/pending-upi-invoices/',
        AdminPendingUPIInvoicesView.as_view(),
        name='admin-pending-upi-invoices'
    ),

    path(
        'invoices/<int:pk>/verify-upi/',
        UPIAdminVerifyView.as_view(),
        name='upi-admin-verify'
    ),

    path(
        'invoices/<int:pk>/reject-upi/',
        UPIAdminRejectView.as_view(),
        name='upi-admin-reject'
    ),

    path(
        'invoices/<int:pk>/pdf/',
        InvoicePDFView.as_view(),
        name='invoice-pdf'
    ),

    path(
        'monthly-sales-report/',
        MonthlySalesReportView.as_view(),
        name='monthly-sales-report'
    ),

    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path(
        'daily-sales-report/',
        DailySalesReportView.as_view(),
        name='daily-sales-report'
    ),
    path('low-stock/', LowStockProductsView.as_view(), name='low-stock'),

    path('', include(router.urls)),
]
