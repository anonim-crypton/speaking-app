import json
import os
import uuid
from datetime import datetime
from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

def admin_gateway_view(request):
    html = """<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Lingo Speek Admin Gateway</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4 font-sans">
  <div class="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl text-center">
    <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5">
      <span class="text-3xl">🛡️</span>
    </div>
    <h1 class="text-2xl font-black tracking-tight mb-1">Lingo Speek Admin</h1>
    <p class="text-xs text-slate-400 mb-6">Boshqaruv Paneli & API Gateway</p>
    
    <div class="space-y-3">
      <a href="http://localhost:5173/admin" class="flex items-center justify-between p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-500/25">
        <span class="flex items-center gap-2.5">
          <span class="text-lg">⚛️</span>
          <span class="text-left">
            <span class="block">React Admin Panel (Asosiy UI)</span>
            <span class="text-[11px] font-normal text-indigo-200">http://localhost:5173/admin</span>
          </span>
        </span>
        <span>→</span>
      </a>

      <a href="/admin/" class="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold text-sm">
        <span class="flex items-center gap-2.5">
          <span class="text-lg">🐍</span>
          <span class="text-left">
            <span class="block">Django Standart Admin</span>
            <span class="text-[11px] font-normal text-slate-400">admin / admin123</span>
          </span>
        </span>
        <span>→</span>
      </a>

      <a href="/api/admin/stats/" class="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold text-sm">
        <span class="flex items-center gap-2.5">
          <span class="text-lg">📊</span>
          <span class="text-left">
            <span class="block">Django REST API Stats</span>
            <span class="text-[11px] font-normal text-slate-400">/api/admin/stats/</span>
          </span>
        </span>
        <span>→</span>
      </a>
    </div>

    <div class="mt-6 pt-5 border-t border-white/10 text-[11px] text-slate-500">
      <p>💡 Siz aytgan React UI dizayndagi Admin Panel <a href="http://localhost:5173/admin" class="text-indigo-400 underline font-mono">localhost:5173/admin</a> da ishlaydi.</p>
    </div>
  </div>
</body>
</html>"""
    return HttpResponse(html)


# Locate backend/data folder
BASE_DIR = settings.BASE_DIR
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
COMPLAINTS_FILE = os.path.join(DATA_DIR, "complaints.json")

# Ensure files exist
os.makedirs(DATA_DIR, exist_ok=True)
for file_path in [USERS_FILE, SESSIONS_FILE, COMPLAINTS_FILE]:
    if not os.path.exists(file_path):
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
        except Exception:
            pass

def read_json(file_path):
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

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

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_SECRET_TOKEN = "lingo-admin-token-supersecure-2026"

class AdminLoginView(APIView):
    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "").strip()

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            return Response({
                "success": True,
                "token": ADMIN_SECRET_TOKEN,
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

        total_users = len(users)
        total_diamonds = sum(u.get("diamonds", 0) for u in users if isinstance(u.get("diamonds"), (int, float)))
        banned_users = sum(1 for u in users if u.get("isBanned"))

        total_sessions = len(sessions)
        blocked_devices = sum(1 for s in sessions if s.get("blocked"))

        total_complaints = len(complaints)
        pending_complaints = sum(1 for c in complaints if c.get("status", "pending") == "pending")

        # Provider breakdown
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
                "providers": providers
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
        elif action == "unban":
            target["isBanned"] = False
            target.pop("bannedAt", None)
        elif action == "add_diamonds":
            amount = int(request.data.get("amount", 0))
            current = target.get("diamonds", 0)
            target["diamonds"] = max(0, current + amount)
        elif action == "toggle_verified":
            target["isVerified"] = not target.get("isVerified", False)
        elif action == "delete":
            users = [u for u in users if u.get("id") != user_id]
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
        # Sort newest first
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
        elif action == "unblock":
            target["blocked"] = False
            target.pop("blockedAt", None)
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
