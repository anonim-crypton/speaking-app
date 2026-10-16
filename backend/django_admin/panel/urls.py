from django.urls import path
from .views import (
    AdminCsrfTokenView,
    AdminLoginView,
    AdminStatsView,
    AdminUsersView,
    AdminUserActionView,
    AdminComplaintsView,
    AdminComplaintActionView,
    AdminDevicesView,
    AdminDeviceActionView,
    AdminSettingsView,
    AdminAnnouncementsView,
    AdminLogsView,
)

urlpatterns = [
    path('csrf/', AdminCsrfTokenView.as_view(), name='admin_csrf'),
    path('login/', AdminLoginView.as_view(), name='admin_login'),
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('users/', AdminUsersView.as_view(), name='admin_users'),
    path('users/<str:user_id>/action/', AdminUserActionView.as_view(), name='admin_user_action'),
    path('complaints/', AdminComplaintsView.as_view(), name='admin_complaints'),
    path('complaints/<str:complaint_id>/action/', AdminComplaintActionView.as_view(), name='admin_complaint_action'),
    path('devices/', AdminDevicesView.as_view(), name='admin_devices'),
    path('devices/<str:session_id>/action/', AdminDeviceActionView.as_view(), name='admin_device_action'),
    path('settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('announcements/', AdminAnnouncementsView.as_view(), name='admin_announcements'),
    path('logs/', AdminLogsView.as_view(), name='admin_logs'),
]
