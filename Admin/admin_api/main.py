import os
import re
from urllib.parse import quote_plus
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from bson import ObjectId
from fastapi import FastAPI, HTTPException, Query
from pymongo import MongoClient
from pymongo.errors import PyMongoError


app = FastAPI(title="Sustenido Admin Data API")

admin_client = None
admin_db = None
target_client = None
target_db = None


def get_admin_mongo_uri() -> str:
    host = os.getenv("ADMIN_MONGO_HOST", "").strip()
    port = os.getenv("ADMIN_MONGO_PORT", "27017").strip()
    user = os.getenv("ADMIN_MONGO_ROOT_USER", "")
    password = os.getenv("ADMIN_MONGO_ROOT_PASSWORD", "")
    if host and user and password:
        return f"mongodb://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/admin?authSource=admin"

    return os.getenv("ADMIN_MONGO_URI", "").strip()


def get_target_mongo_uri() -> str:
    uri = os.getenv("TARGET_MONGO_URI") or os.getenv("SUSTENIDO_MONGO_URI") or ""
    host = os.getenv("TARGET_MONGO_HOST", "").strip()
    if not uri or not host:
        return uri

    port = os.getenv("TARGET_MONGO_PORT", "27017").strip()
    return re.sub(r"(?<=@)[^/:?]+(?::\d+)?", f"{host}:{port}", uri, count=1)


def normalize_email(value: str = "") -> str:
    return str(value or "").strip().lower()


def serialize_id(value: Any) -> str:
    return str(value or "")


def serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    return value


def is_song_entry(entry: Any) -> bool:
    if not isinstance(entry, dict):
        return False
    return bool(str(entry.get("song") or "").strip() and str(entry.get("artist") or "").strip())


def get_admin_db():
    global admin_client, admin_db
    if admin_db is not None:
        return admin_db

    uri = get_admin_mongo_uri()
    if not uri:
        raise HTTPException(
            status_code=503,
            detail="Configure ADMIN_MONGO_URI or the ADMIN_MONGO_HOST/user/password variables",
        )
    db_name = os.getenv("ADMIN_DB_NAME", "adminPanel")
    admin_client = MongoClient(uri, serverSelectionTimeoutMS=int(os.getenv("ADMIN_MONGO_TIMEOUT_MS", "5000")))
    admin_client.admin.command("ping")
    admin_db = admin_client[db_name]
    return admin_db


def get_target_db():
    global target_client, target_db
    if target_db is not None:
        return target_db

    uri = get_target_mongo_uri()
    if not uri:
        raise HTTPException(status_code=503, detail="TARGET_MONGO_URI or SUSTENIDO_MONGO_URI is required")

    if re.search(r"//(?:[^@/]+@)?(?:db|sustenido_mongodb_container):27017(?:[/?]|$)", uri):
        raise HTTPException(
            status_code=503,
            detail="Invalid target Mongo URI for isolated Admin: use host.docker.internal:27018, not db:27017.",
        )

    db_name = os.getenv("TARGET_DB_NAME") or os.getenv("APP_DATABASE_NAME") or "sustenido"
    target_client = MongoClient(uri, serverSelectionTimeoutMS=int(os.getenv("TARGET_MONGO_TIMEOUT_MS", "5000")))
    target_client.admin.command("ping")
    target_db = target_client[db_name]
    return target_db


def safe_target_db():
    try:
        return get_target_db()
    except HTTPException:
        raise
    except PyMongoError as error:
        raise HTTPException(status_code=503, detail=f"Banco do Sustenido indisponivel: {error}") from error


def parse_date_param(value: str = "", fallback: datetime | None = None, end_of_day: bool = False) -> datetime:
    if not value:
        return fallback or datetime.utcnow()
    normalized = str(value).strip().replace("Z", "+00:00")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", normalized):
        suffix = "23:59:59.999999" if end_of_day else "00:00:00"
        normalized = f"{normalized}T{suffix}"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=f"Data invalida: {value}") from error
    return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed


def analytics_window(start: str = "", end: str = "", environment: str = "") -> tuple[dict, datetime, datetime]:
    default_end = datetime.utcnow()
    default_start = default_end - timedelta(days=30)
    start_date = parse_date_param(start, default_start)
    end_date = parse_date_param(end, default_end, end_of_day=True)
    query: dict[str, Any] = {"timestamp": {"$gte": start_date, "$lte": end_date}}
    if environment:
        query["environment"] = environment
    return query, start_date, end_date


def event_user_key(event: dict) -> str:
    user_id = event.get("userId") or event.get("user_id") or ""
    email = event.get("email") or event.get("userEmail") or ""
    anonymous_id = event.get("anonymousId") or event.get("sessionId") or ""
    return str(user_id or normalize_email(email) or anonymous_id or "").strip()


def event_name(event: dict) -> str:
    return str(event.get("eventName") or event.get("event") or event.get("name") or "").strip()


def event_properties(event: dict) -> dict:
    props = event.get("properties")
    return props if isinstance(props, dict) else {}


def safe_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def count_unique_event_users(db, query: dict, names: list[str]) -> int:
    users = set()
    for event in db.analytics_events.find({**query, "eventName": {"$in": names}}, {"userId": 1, "user_id": 1, "email": 1, "userEmail": 1, "anonymousId": 1, "sessionId": 1}):
        key = event_user_key(event)
        if key:
            users.add(key)
    return len(users)


def count_unique_users_since(db, days: int, environment: str = "") -> int:
    query = {"timestamp": {"$gte": datetime.utcnow() - timedelta(days=days)}}
    if environment:
        query["environment"] = environment
    users = set()
    for event in db.analytics_events.find(query, {"userId": 1, "user_id": 1, "email": 1, "userEmail": 1, "anonymousId": 1, "sessionId": 1}):
        key = event_user_key(event)
        if key:
            users.add(key)
    return len(users)


def date_key(value: datetime) -> str:
    return value.strftime("%Y-%m-%d")


def count_daily_metric_users_since(db, days: int) -> int:
    cutoff = date_key(datetime.utcnow() - timedelta(days=days))
    users = set()
    for item in db.user_daily_metrics.find({"date": {"$gte": cutoff}}, {"userId": 1, "email": 1, "anonymousId": 1}):
        key = str(item.get("userId") or normalize_email(item.get("email")) or item.get("anonymousId") or "").strip()
        if key:
            users.add(key)
    return len(users)


def count_last_login_users_since(db, days: int) -> int:
    cutoff = datetime.utcnow() - timedelta(days=days)
    return db.authUsers.count_documents({"lastLoginAt": {"$gte": cutoff}, "deletedAt": {"$exists": False}})


def active_users_since(db, days: int, environment: str = "") -> int:
    return (
        count_daily_metric_users_since(db, days)
        or count_unique_users_since(db, days, environment)
        or count_last_login_users_since(db, days)
    )


def count_created_users_between(db, start_date: datetime, end_date: datetime) -> int:
    count = 0
    for user in db.authUsers.find({"deletedAt": {"$exists": False}}, {"_id": 1, "approvalRequestedAt": 1, "createdAt": 1}):
        created_at = user.get("createdAt") or user.get("approvalRequestedAt")
        if not created_at and user.get("_id"):
            created_at = user["_id"].generation_time.replace(tzinfo=None)
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except ValueError:
                created_at = None
        if isinstance(created_at, datetime) and start_date <= created_at.replace(tzinfo=None) <= end_date:
            count += 1
    return count


def count_users_with_songs(db) -> int:
    users = 0
    for doc in db.data.find({}, {"userdata": 1}):
        entries = doc.get("userdata") if isinstance(doc.get("userdata"), list) else []
        if any(is_song_entry(entry) for entry in entries):
            users += 1
    return users


def product_daily_sum(db, start_date: datetime, end_date: datetime, field: str, environment: str = "") -> int:
    query: dict[str, Any] = {"date": {"$gte": date_key(start_date), "$lte": date_key(end_date)}}
    if environment:
        query["environment"] = environment
    total = 0
    for item in db.product_metrics_daily.find(query, {field: 1}):
        total += int(item.get(field) or 0)
    return total


def serialize_admin_log(log: dict) -> dict:
    return {
        "id": serialize_id(log.get("_id")),
        "adminId": log.get("adminId") or "",
        "adminEmail": log.get("adminEmail") or "",
        "action": log.get("action") or "",
        "targetType": log.get("targetType") or "",
        "targetUserEmail": log.get("targetUserEmail") or "",
        "targetUserId": log.get("targetUserId") or "",
        "metadata": serialize_value(log.get("metadata") or {}),
        "reason": log.get("reason") or "",
        "createdAt": serialize_value(log.get("createdAt")),
        "request": serialize_value(log.get("request") or {}),
    }


def serialize_auth_user(user: dict, data_doc: dict | None = None, pending_invites: int = 0) -> dict:
    data_doc = data_doc or {}
    userdata = data_doc.get("userdata") if isinstance(data_doc.get("userdata"), list) else []
    profile_entry = next((entry for entry in userdata if isinstance(entry, dict)), None) or {}
    songs = [entry for entry in userdata if is_song_entry(entry)]
    accepted_invitations = user.get("acceptedInvitations") if isinstance(user.get("acceptedInvitations"), list) else []
    created_at = user.get("createdAt")
    if not created_at and user.get("_id"):
        created_at = user["_id"].generation_time
    reset_expires_at = user.get("resetPasswordExpiresAt")
    reset_requested_at = user.get("resetPasswordRequestedAt")
    if not reset_requested_at and isinstance(reset_expires_at, datetime):
        reset_requested_at = reset_expires_at - timedelta(minutes=30)
    reset_pending = bool(
        user.get("resetPasswordTokenHash")
        and isinstance(reset_expires_at, datetime)
        and reset_expires_at.replace(tzinfo=None) > datetime.utcnow()
    )

    return {
        "id": serialize_id(user.get("_id")),
        "email": normalize_email(user.get("email")),
        "username": profile_entry.get("username") or user.get("username") or "",
        "fullName": profile_entry.get("fullName") or user.get("fullName") or "",
        "role": user.get("role") or "user",
        "adminEnabled": user.get("adminEnabled") is True,
        "approvalStatus": user.get("approvalStatus") or "pending",
        "approvalRequestedAt": serialize_value(user.get("approvalRequestedAt")),
        "approvedAt": serialize_value(user.get("approvedAt")),
        "rejectedAt": serialize_value(user.get("rejectedAt")),
        "blockedAt": serialize_value(user.get("blockedAt")),
        "deletedAt": serialize_value(user.get("deletedAt")),
        "passwordChangedAt": serialize_value(user.get("passwordChangedAt")),
        "resetPasswordRequestedAt": serialize_value(reset_requested_at),
        "resetPasswordExpiresAt": serialize_value(reset_expires_at),
        "passwordResetPending": reset_pending,
        "songCount": len(songs),
        "friendCount": len(accepted_invitations),
        "pendingInvitationCount": pending_invites,
        "createdAt": serialize_value(created_at),
    }


def find_user(db, user_id: str) -> dict | None:
    value = str(user_id or "").strip()
    query = {"_id": ObjectId(value)} if ObjectId.is_valid(value) else {"email": normalize_email(value)}
    return db.authUsers.find_one(query)


@app.get("/health")
def health():
    status = {"ok": True, "service": "admin-data-api"}
    try:
        get_admin_db().command("ping")
        status["adminDb"] = "ok"
    except PyMongoError as error:
        status["adminDb"] = f"error: {error}"

    try:
        safe_target_db().command("ping")
        status["targetDb"] = "ok"
    except HTTPException as error:
        status["targetDb"] = f"error: {error.detail}"

    return status


@app.get("/summary")
def summary():
    db = safe_target_db()
    admin = get_admin_db()

    user_filter = {"deletedAt": {"$exists": False}}
    users_total = db.authUsers.count_documents(user_filter)
    pending = db.authUsers.count_documents({**user_filter, "approvalStatus": "pending"})
    approved = db.authUsers.count_documents({**user_filter, "approvalStatus": "approved"})
    rejected = db.authUsers.count_documents({**user_filter, "approvalStatus": "rejected"})
    blocked = db.authUsers.count_documents({**user_filter, "approvalStatus": "blocked"})

    song_docs = list(db.data.find({}, {"email": 1, "userdata": 1}))
    song_counts = [
        len([entry for entry in doc.get("userdata", []) if is_song_entry(entry)])
        for doc in song_docs
    ]

    pending_invitations = db.invitations.count_documents({"status": "pending"})
    accepted_total = 0
    for user in db.authUsers.find({"acceptedInvitations": {"$exists": True}}, {"acceptedInvitations": 1}):
        accepted = user.get("acceptedInvitations")
        accepted_total += len(accepted) if isinstance(accepted, list) else 0

    recent_admin_actions = list(admin.adminLogs.find({}).sort("createdAt", -1).limit(8))

    return {
        "users": {
            "total": users_total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "blocked": blocked,
        },
        "songs": {
            "totalUserSongsApprox": sum(song_counts),
            "usersWithSongs": len([count for count in song_counts if count > 0]),
        },
        "friendships": {
            "pendingInvitations": pending_invitations,
            "acceptedRelations": accepted_total // 2,
        },
        "recentAdminActions": [serialize_admin_log(log) for log in recent_admin_actions],
    }


@app.get("/users")
def users(
    q: str = "",
    status: str = "",
    role: str = "",
    password_reset_pending: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    sort: str = "_id",
    direction: str = "desc",
):
    return list_users(q=q, status=status, role=role, password_reset_pending=password_reset_pending, page=page, limit=limit, sort=sort, direction=direction)


def list_users(
    q: str = "",
    status: str = "",
    role: str = "",
    password_reset_pending: bool = False,
    page: int = 1,
    limit: int = 25,
    sort: str = "_id",
    direction: str = "desc",
):
    db = safe_target_db()
    query: dict[str, Any] = {"deletedAt": {"$exists": False}}
    normalized_q = normalize_email(q)
    if normalized_q:
        query["email"] = {"$regex": re.escape(normalized_q), "$options": "i"}
    if status:
        query["approvalStatus"] = status
    if role:
        query["role"] = role
    if password_reset_pending:
        query["resetPasswordTokenHash"] = {"$exists": True, "$ne": ""}
        query["resetPasswordExpiresAt"] = {"$gt": datetime.utcnow()}

    allowed_sort = {"email", "approvalStatus", "role", "approvalRequestedAt", "approvedAt", "_id"}
    sort_field = sort if sort in allowed_sort else "_id"
    sort_direction = 1 if direction == "asc" else -1

    total = db.authUsers.count_documents(query)
    user_docs = list(
        db.authUsers.find(query)
        .sort(sort_field, sort_direction)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    emails = [normalize_email(user.get("email")) for user in user_docs]

    data_by_email = {
        normalize_email(doc.get("email")): doc
        for doc in db.data.find({"email": {"$in": emails}})
    }
    pending_by_email = {
        normalize_email(item["_id"]): item["count"]
        for item in db.invitations.aggregate([
            {"$match": {"status": "pending", "receiverEmail": {"$in": emails}}},
            {"$group": {"_id": "$receiverEmail", "count": {"$sum": 1}}},
        ])
    }

    return {
        "items": [
            serialize_auth_user(
                user,
                data_by_email.get(normalize_email(user.get("email"))),
                pending_by_email.get(normalize_email(user.get("email")), 0),
            )
            for user in user_docs
        ],
        "page": page,
        "limit": limit,
        "total": total,
    }


@app.get("/users/pending")
def pending_users():
    return list_users(status="pending", page=1, limit=100)


@app.get("/users/{user_id}")
def user_details(user_id: str):
    db = safe_target_db()
    user = find_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    email = normalize_email(user.get("email"))
    data_doc = db.data.find_one({"email": email})
    logs = list(db.userLogs.find({"userEmail": email}).sort("createdAt", -1).limit(20))
    profile_image = db.profileImages.find_one({"email": email}, {"data": 0, "image": 0})
    calendar_count = db.calendarEvents.count_documents({"ownerEmail": email})
    pending_count = db.invitations.count_documents({
        "status": "pending",
        "$or": [{"senderEmail": email}, {"receiverEmail": email}],
    })

    return {
        "user": serialize_auth_user(user, data_doc, pending_count),
        "dataDoc": serialize_value({
            "id": serialize_id(data_doc.get("_id")) if data_doc else "",
            "email": data_doc.get("email") if data_doc else "",
            "availableSetlists": data_doc.get("availableSetlists", []) if data_doc else [],
        }) if data_doc else None,
        "profileImage": serialize_value(profile_image),
        "calendarOwnedCount": calendar_count,
        "recentLogs": [serialize_value({**log, "id": serialize_id(log.get("_id"))}) for log in logs],
    }


@app.get("/users/{user_id}/songs")
def user_songs(user_id: str):
    db = safe_target_db()
    user = find_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    data_doc = db.data.find_one({"email": normalize_email(user.get("email"))})
    songs = [entry for entry in data_doc.get("userdata", []) if is_song_entry(entry)] if data_doc else []
    return {
        "items": [
            {
                "key": f"{song.get('artist') or ''}::{song.get('song') or ''}",
                "id": song.get("id"),
                "artist": song.get("artist") or "",
                "song": song.get("song") or "",
                "progressBar": song.get("progressBar") or 0,
                "addedIn": serialize_value(song.get("addedIn")),
                "updateIn": serialize_value(song.get("updateIn")),
                "instruments": serialize_value(song.get("instruments") or {}),
                "setlist": song.get("setlist") if isinstance(song.get("setlist"), list) else [],
            }
            for song in songs
        ]
    }


@app.get("/friendships")
def friendships():
    db = safe_target_db()
    pending = list(db.invitations.find({"status": "pending"}).sort("createdAt", -1).limit(100))
    users_with_friends = list(
        db.authUsers.find(
            {"acceptedInvitations": {"$exists": True, "$ne": []}},
            {"email": 1, "acceptedInvitations": 1},
        )
    )

    return {
        "pending": [
            {
                "id": serialize_id(item.get("_id")),
                "senderEmail": item.get("senderEmail") or "",
                "receiverEmail": item.get("receiverEmail") or "",
                "status": item.get("status") or "",
                "createdAt": serialize_value(item.get("createdAt")),
                "updatedAt": serialize_value(item.get("updatedAt")),
            }
            for item in pending
        ],
        "accepted": [
            {
                "userEmail": user.get("email") or "",
                "counterpartEmail": item.get("counterpartEmail") or "",
                "counterpartUsername": item.get("counterpartUsername") or item.get("username") or "",
                "createdAt": serialize_value(item.get("createdAt")),
                "source": item.get("source") or "authUsers.acceptedInvitations",
            }
            for user in users_with_friends
            for item in (user.get("acceptedInvitations") or [])
            if isinstance(item, dict)
        ],
    }


@app.get("/users/{user_id}/friendships")
def user_friendships(user_id: str):
    db = safe_target_db()
    user = find_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    email = normalize_email(user.get("email"))
    pending = list(db.invitations.find({
        "status": "pending",
        "$or": [{"senderEmail": email}, {"receiverEmail": email}],
    }).sort("createdAt", -1))

    return {
        "accepted": [
            {
                "counterpartEmail": item.get("counterpartEmail") or "",
                "counterpartUsername": item.get("counterpartUsername") or item.get("username") or "",
                "createdAt": serialize_value(item.get("createdAt")),
                "source": "authUsers.acceptedInvitations",
            }
            for item in (user.get("acceptedInvitations") or [])
            if isinstance(item, dict)
        ],
        "pendingSent": [
            serialize_value({**item, "id": serialize_id(item.get("_id"))})
            for item in pending
            if normalize_email(item.get("senderEmail")) == email
        ],
        "pendingReceived": [
            serialize_value({**item, "id": serialize_id(item.get("_id"))})
            for item in pending
            if normalize_email(item.get("receiverEmail")) == email
        ],
    }


@app.get("/logs")
def admin_logs(limit: int = Query(50, ge=1, le=200)):
    admin = get_admin_db()
    logs = list(admin.adminLogs.find({}).sort("createdAt", -1).limit(limit))
    return {"items": [serialize_admin_log(log) for log in logs]}


@app.get("/users/{user_id}/logs")
def user_logs(user_id: str):
    db = safe_target_db()
    admin = get_admin_db()
    user = find_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    email = normalize_email(user.get("email"))
    product_logs = list(db.userLogs.find({"userEmail": email}).sort("createdAt", -1).limit(50))
    admin_logs_docs = list(admin.adminLogs.find({"targetUserEmail": email}).sort("createdAt", -1).limit(50))

    return {
        "userLogs": [serialize_value({**log, "id": serialize_id(log.get("_id"))}) for log in product_logs],
        "adminLogs": [serialize_admin_log(log) for log in admin_logs_docs],
    }


@app.get("/analytics/summary")
def analytics_summary(start: str = "", end: str = "", environment: str = ""):
    db = safe_target_db()
    query, start_date, end_date = analytics_window(start, end, environment)
    events = db.analytics_events

    total_events = events.count_documents(query) or product_daily_sum(db, start_date, end_date, "events", environment)
    signup_users = count_unique_event_users(db, query, ["signup_completed"]) or count_created_users_between(db, start_date, end_date)
    activated_users = count_unique_event_users(db, query, ["practice_started", "practice_finished"]) or count_users_with_songs(db)
    practice_sessions = (
        events.count_documents({**query, "eventName": "practice_started"})
        or product_daily_sum(db, start_date, end_date, "practiceStarted", environment)
    )
    presentations_opened = (
        events.count_documents({**query, "eventName": "presentation_opened"})
        or product_daily_sum(db, start_date, end_date, "presentationsOpened", environment)
    )
    technical_errors = (
        events.count_documents({**query, "eventName": {"$in": ["frontend_error", "api_error", "smtp_error", "safari_error"]}})
        or product_daily_sum(db, start_date, end_date, "errors", environment)
    )

    finished_events = events.find({**query, "eventName": "practice_finished"}, {"properties.durationSeconds": 1})
    durations = []
    for event in finished_events:
        duration = safe_float(event_properties(event).get("durationSeconds"))
        if duration > 0:
            durations.append(duration)

    users_total = db.authUsers.count_documents({"deletedAt": {"$exists": False}})
    activation_base = signup_users or users_total
    activation_rate = round((activated_users / activation_base) * 100, 1) if activation_base else 0
    avg_session_minutes = round((sum(durations) / len(durations)) / 60, 1) if durations else 0

    return {
        "range": {"start": serialize_value(start_date), "end": serialize_value(end_date), "environment": environment},
        "events": {"total": total_events, "technicalErrors": technical_errors},
        "users": {
            "dau": active_users_since(db, 1, environment),
            "wau": active_users_since(db, 7, environment),
            "mau": active_users_since(db, 30, environment),
            "new": signup_users,
            "activated": activated_users,
            "activationRate": activation_rate,
        },
        "usage": {
            "practiceSessions": practice_sessions,
            "presentationsOpened": presentations_opened,
            "avgSessionMinutes": avg_session_minutes,
        },
    }


@app.get("/analytics/activation-funnel")
def analytics_activation_funnel(start: str = "", end: str = "", environment: str = ""):
    db = safe_target_db()
    query, _, _ = analytics_window(start, end, environment)
    steps = [
        ("signup_completed", "Cadastro concluido"),
        ("email_confirmed", "Email confirmado"),
        ("login_success", "Login realizado"),
        ("first_song_added", "Primeira musica"),
        ("first_presentation_opened", "Primeira apresentacao"),
        ("practice_started", "Pratica iniciada"),
    ]

    counts = [(name, label, count_unique_event_users(db, query, [name])) for name, label in steps]
    baseline = counts[0][2] if counts else 0
    return {
        "items": [
            {
                "key": name,
                "label": label,
                "users": count,
                "conversion": round((count / baseline) * 100, 1) if baseline else 0,
            }
            for name, label, count in counts
        ]
    }


@app.get("/analytics/top-songs")
def analytics_top_songs(start: str = "", end: str = "", environment: str = "", limit: int = Query(12, ge=1, le=50)):
    db = safe_target_db()
    query, _, _ = analytics_window(start, end, environment)
    relevant_names = ["song_opened", "presentation_opened", "practice_started", "practice_finished"]
    rows: dict[str, dict] = {}

    for event in db.analytics_events.find({**query, "eventName": {"$in": relevant_names}}).sort("timestamp", -1).limit(8000):
        props = event_properties(event)
        song = str(props.get("song") or props.get("songName") or props.get("title") or "Sem titulo").strip()
        artist = str(props.get("artist") or props.get("artistName") or "Artista nao informado").strip()
        song_id = str(props.get("songId") or props.get("id") or f"{artist}::{song}")
        key = song_id or f"{artist}::{song}"
        row = rows.setdefault(key, {
            "key": key,
            "song": song,
            "artist": artist,
            "opens": 0,
            "practiceSessions": 0,
            "totalPracticeMinutes": 0,
            "lastEventAt": "",
        })
        name = event_name(event)
        if name in ["song_opened", "presentation_opened"]:
            row["opens"] += 1
        if name == "practice_started":
            row["practiceSessions"] += 1
        if name == "practice_finished":
            row["totalPracticeMinutes"] += safe_float(props.get("durationSeconds")) / 60
        if not row["lastEventAt"]:
            row["lastEventAt"] = serialize_value(event.get("timestamp"))

    items = sorted(rows.values(), key=lambda item: (item["practiceSessions"], item["opens"]), reverse=True)
    for item in items:
        item["totalPracticeMinutes"] = round(item["totalPracticeMinutes"], 1)
    return {"items": items[:limit]}


@app.get("/analytics/errors")
def analytics_errors(start: str = "", end: str = "", environment: str = "", limit: int = Query(50, ge=1, le=100)):
    db = safe_target_db()
    query, _, _ = analytics_window(start, end, environment)
    error_names = ["frontend_error", "api_error", "smtp_error", "safari_error"]
    counts = defaultdict(int)
    recent = []

    for event in db.analytics_events.find({**query, "eventName": {"$in": error_names}}).sort("timestamp", -1).limit(limit):
        name = event_name(event)
        props = event_properties(event)
        counts[name] += 1
        recent.append({
            "id": serialize_id(event.get("_id")),
            "eventName": name,
            "message": props.get("message") or props.get("error") or props.get("reason") or "",
            "path": props.get("path") or props.get("url") or "",
            "user": event_user_key(event),
            "timestamp": serialize_value(event.get("timestamp")),
        })

    return {
        "counts": [{"eventName": name, "count": count} for name, count in sorted(counts.items())],
        "recent": recent,
    }
