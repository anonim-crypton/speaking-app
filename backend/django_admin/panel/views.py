import json
import os
import uuid
import hmac
import hashlib
import time
from datetime import datetime
from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

def admin_spa_view(request):
    template_path = os.path.join(settings.BASE_DIR, "panel", "templates", "react_admin.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return HttpResponse(content, content_type="text/html")
    return HttpResponse("Admin panel template not found", status=404)

# Locate backend/data folder
BASE_DIR = settings.BASE_DIR
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
COMPLAINTS_FILE = os.path.join(DATA_DIR, "complaints.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
ANNOUNCEMENTS_FILE = os.path.join(DATA_DIR, "announcements.json")
AUDIT_LOGS_FILE = os.path.join(DATA_DIR, "audit_logs.json")

# Ensure files exist
os.makedirs(DATA_DIR, exist_ok=True)
for file_path, default_val in [
    (USERS_FILE, []),
    (SESSIONS_FILE, []),
    (COMPLAINTS_FILE, []),
    (ANNOUNCEMENTS_FILE, []),
    (AUDIT_LOGS_FILE, []),
    (SETTINGS_FILE, {
        "maintenanceMode": False,
        "defaultSignupDiamonds": 50,
        "matchCostDiamonds": 0,
        "dailyRewardDiamonds": 20,
        "allowGuestMatch": True,
        "chatMessageFilter": True,
        "platformNotice": "Lingo Speek platformasi barqaror ishlamoqda."
    })
]:
    if not os.path.exists(file_path):
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(default_val, f, indent=2)
        except Exception:
            pass

def read_json(file_path, default=None):
    if not os.path.exists(file_path):
        return [] if default is None else default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return [] if default is None else default

def write_json(file_path, data):
    try:
        temp_path = f"{file_path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(temp_path, file_path)
        return True
    except Exception as e:
        print(f"Error writing to {file_path}: {e}")
        return False

def log_admin_action(action_type, details, target_id=None):
    logs = read_json(AUDIT_LOGS_FILE, default=[])
    logs.insert(0, {
        "id": "log_" + uuid.uuid4().hex[:10],
        "action": action_type,
        "details": details,
        "targetId": target_id,
        "timestamp": datetime.utcnow().isoformat(),
        "admin": "Super Admin"
    })
    if len(logs) > 200:
        logs = logs[:200]
    write_json(AUDIT_LOGS_FILE, logs)

# Admin credentials & Security
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
SECRET_SALT = "lingo-speek-supersecret-salt-2026"

def generate_csrf_and_signature(sub="gate"):
    ts = str(int(time.time()))
    csrf_raw = f"{sub}:{ts}:{SECRET_SALT}"
    csrf_token = hashlib.sha256(csrf_raw.encode()).hexdigest()[:32]
    sig_raw = f"{csrf_token}:{ts}:{SECRET_SALT}"
    url_sig = hmac.new(SECRET_SALT.encode(), sig_raw.encode(), hashlib.sha256).hexdigest()[:24]
    return {
        "csrfToken": csrf_token,
        "timestamp": ts,
        "urlSignature": url_sig,
        "encryptedUrlParams": f"csrf={csrf_token}&sec_sign={url_sig}&t={ts}"
    }

class AdminCsrfTokenView(APIView):
    def get(self, request):
        sub = request.GET.get("scope", "guest")
        security_data = generate_csrf_and_signature(sub)
        return Response({
            "success": True,
            **security_data
        })

class AdminLoginView(APIView):
    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "").strip()

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            sec = generate_csrf_and_signature("session")
            session_token = f"adm_{sec['csrfToken']}"
            log_admin_action("admin_login", "Admin tizimga muvaffaqiyatli kirdi")
            return Response({
                "success": True,
                "token": session_token,
                "csrfToken": sec["csrfToken"],
                "urlSignature": sec["urlSignature"],
                "encryptedUrlHash": f"token={session_token[:12]}...&sig={sec['urlSignature']}",
                "user": {
                    "username": ADMIN_USERNAME,
                    "role": "Super Admin"
                }
            })
        return Response(
            {"success": False, "message": "Noto'g'ri login yoki parol"},
            status=status.HTTP_401_UNAUTHORIZED
        )

class AdminStatsView(APIView):
    def get(self, request):
        users = read_json(USERS_FILE)
        sessions = read_json(SESSIONS_FILE)
        complaints = read_json(COMPLAINTS_FILE)
        settings_data = read_json(SETTINGS_FILE, default={})

        total_users = len(users)
        total_diamonds = sum(u.get("diamonds", 0) for u in users if isinstance(u.get("diamonds"), (int, float)))
        banned_users = sum(1 for u in users if u.get("isBanned"))

        total_sessions = len(sessions)
        blocked_devices = sum(1 for s in sessions if s.get("blocked"))

        total_complaints = len(complaints)
        pending_complaints = sum(1 for c in complaints if c.get("status", "pending") == "pending")

        providers = {}
        for u in users:
            p = u.get("provider", "other") or "other"
            providers[p] = providers.get(p, 0) + 1

        return Response({
            "success": True,
            "stats": {
                "totalUsers": total_users,
                "bannedUsers": banned_users,
                "totalDiamonds": total_diamonds,
                "totalSessions": total_sessions,
                "blockedDevices": blocked_devices,
                "totalComplaints": total_complaints,
                "pendingComplaints": pending_complaints,
                "providers": providers,
                "maintenanceMode": settings_data.get("maintenanceMode", False)
            }
        })

class AdminUsersView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip().lower()
        users = read_json(USERS_FILE)

        if query:
            users = [
                u for u in users
                if query in str(u.get("name") or "").lower()
                or query in str(u.get("email") or "").lower()
                or query in str(u.get("phone") or "").lower()
                or query in str(u.get("id") or "").lower()
            ]

        return Response({
            "success": True,
            "users": users
        })

class AdminUserActionView(APIView):
    def post(self, request, user_id):
        action = request.data.get("action")
        users = read_json(USERS_FILE)

        target = None
        for u in users:
            if u.get("id") == user_id:
                target = u
                break

        if not target:
            return Response(
                {"success": False, "message": "Foydalanuvchi topilmadi"},
                status=status.HTTP_404_NOT_FOUND
            )

        if action == "ban":
            target["isBanned"] = True
            target["bannedAt"] = datetime.utcnow().isoformat()
            log_admin_action("user_banned", f"Foydalanuvchi bloklandi: {target.get('name') or target.get('phone') or user_id}", user_id)
        elif action == "unban":
            target["isBanned"] = False
            target.pop("bannedAt", None)
            log_admin_action("user_unbanned", f"Foydalanuvchi blokdan chiqarildi: {target.get('name') or target.get('phone') or user_id}", user_id)
        elif action == "add_diamonds":
            amount = int(request.data.get("amount", 0))
            current = target.get("diamonds", 0)
            target["diamonds"] = max(0, current + amount)
            log_admin_action("diamonds_adjusted", f"{amount} ta olmos o'zgartirildi (Yangi balans: {target['diamonds']})", user_id)
        elif action == "toggle_verified":
            target["isVerified"] = not target.get("isVerified", False)
            log_admin_action("verification_toggled", f"Tasdiqlanganlik holati: {target['isVerified']}", user_id)
        elif action == "delete":
            users = [u for u in users if u.get("id") != user_id]
            log_admin_action("user_deleted", f"Foydalanuvchi o'chirildi: {user_id}", user_id)
        else:
            return Response(
                {"success": False, "message": f"Noma'lum amal: {action}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        write_json(USERS_FILE, users)
        return Response({
            "success": True,
            "message": "Amal muvaffaqiyatli bajarildi",
            "user": target
        })

class AdminComplaintsView(APIView):
    def get(self, request):
        complaints = read_json(COMPLAINTS_FILE)
        complaints.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return Response({
            "success": True,
            "complaints": complaints
        })

class AdminComplaintActionView(APIView):
    def post(self, request, complaint_id):
        action = request.data.get("action")  # 'resolved' or 'dismissed'
        complaints = read_json(COMPLAINTS_FILE)

        found = False
        for c in complaints:
            if c.get("id") == complaint_id:
                c["status"] = action if action in ["resolved", "dismissed"] else "resolved"
                c["updatedAt"] = datetime.utcnow().isoformat()
                found = True
                break

        if not found:
            return Response(
                {"success": False, "message": "Shikoyat topilmadi"},
                status=status.HTTP_404_NOT_FOUND
            )

        write_json(COMPLAINTS_FILE, complaints)
        log_admin_action("complaint_updated", f"Shikoyat ({complaint_id}) holati: {action}")
        return Response({
            "success": True,
            "message": "Shikoyat holati yangilandi"
        })

class AdminDevicesView(APIView):
    def get(self, request):
        sessions = read_json(SESSIONS_FILE)
        sessions.sort(key=lambda x: x.get("lastActive", ""), reverse=True)
        return Response({
            "success": True,
            "devices": sessions
        })

class AdminDeviceActionView(APIView):
    def post(self, request, session_id):
        action = request.data.get("action")  # 'block', 'unblock', 'revoke'
        sessions = read_json(SESSIONS_FILE)

        if action == "revoke":
            sessions = [s for s in sessions if s.get("id") != session_id]
            write_json(SESSIONS_FILE, sessions)
            log_admin_action("device_session_revoked", f"Seans o'chirildi: {session_id}")
            return Response({"success": True, "message": "Seans o'chirildi"})

        target = None
        for s in sessions:
            if s.get("id") == session_id:
                target = s
                break

        if not target:
            return Response(
                {"success": False, "message": "Qurilma seansi topilmadi"},
                status=status.HTTP_404_NOT_FOUND
            )

        if action == "block":
            target["blocked"] = True
            target["blockedAt"] = datetime.utcnow().isoformat()
            log_admin_action("device_blocked", f"Qurilma bloklandi: {target.get('deviceName')} ({target.get('ip')})")
        elif action == "unblock":
            target["blocked"] = False
            target.pop("blockedAt", None)
            log_admin_action("device_unblocked", f"Qurilma blokdan chiqarildi: {target.get('deviceName')} ({target.get('ip')})")
        else:
            return Response(
                {"success": False, "message": f"Noma'lum amal: {action}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        write_json(SESSIONS_FILE, sessions)
        return Response({
            "success": True,
            "message": "Qurilma holati yangilandi",
            "device": target
        })

class AdminSettingsView(APIView):
    def get(self, request):
        settings_data = read_json(SETTINGS_FILE, default={})
        return Response({
            "success": True,
            "settings": settings_data
        })

    def post(self, request):
        current = read_json(SETTINGS_FILE, default={})
        new_settings = {**current, **request.data}
        write_json(SETTINGS_FILE, new_settings)
        log_admin_action("settings_updated", "Platforma asosiy sozlamalari yangilandi")
        return Response({
            "success": True,
            "message": "Sozlamalar muvaffaqiyatli saqlandi",
            "settings": new_settings
        })

class AdminAnnouncementsView(APIView):
    def get(self, request):
        items = read_json(ANNOUNCEMENTS_FILE, default=[])
        return Response({
            "success": True,
            "announcements": items
        })

    def post(self, request):
        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        priority = request.data.get("priority", "info")

        if not title or not body:
            return Response(
                {"success": False, "message": "Sarlavha va matn talab qilinadi"},
                status=status.HTTP_400_BAD_REQUEST
            )

        items = read_json(ANNOUNCEMENTS_FILE, default=[])
        new_item = {
            "id": "ann_" + uuid.uuid4().hex[:8],
            "title": title,
            "body": body,
            "priority": priority,
            "createdAt": datetime.utcnow().isoformat(),
            "active": True
        }
        items.insert(0, new_item)
        write_json(ANNOUNCEMENTS_FILE, items)
        log_admin_action("broadcast_announcement", f"E'lon tarqatildi: {title}")
        return Response({
            "success": True,
            "message": "Bildirishnoma barcha foydalanuvchilarga yuborildi",
            "announcement": new_item
        })

class AdminLogsView(APIView):
    def get(self, request):
        logs = read_json(AUDIT_LOGS_FILE, default=[])
        return Response({
            "success": True,
            "logs": logs
        })
