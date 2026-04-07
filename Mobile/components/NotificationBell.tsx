import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { io, Socket } from "socket.io-client";
import {
  API_SOCKET_BASE_URL,
  fetchNotifications,
  getCurrentUserEmail,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationEntry,
} from "@/connect/connect";

const GOLD = "#d9ad26";
const CLEANED_NOTIFICATIONS_KEY = "cleanedNotifications";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function NotificationBell() {
  const sheetRef = useRef<ActionSheetRef>(null);
  const socketRef = useRef<Socket | null>(null);
  const cleanedIdsRef = useRef<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const getCleanedIds = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CLEANED_NOTIFICATIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [nextNotifications, cleanedIds] = await Promise.all([
        fetchNotifications(),
        getCleanedIds(),
      ]);
      cleanedIdsRef.current = cleanedIds;
      setNotifications(
        nextNotifications.filter(
          (notification) => !cleanedIds.includes(notification._id)
        )
      );
    } catch (error) {
      console.warn(`[${Platform.OS}] [notifications] failed to load`, error);
    } finally {
      setLoading(false);
    }
  }, [getCleanedIds]);

  const upsertNotification = useCallback((notification: NotificationEntry) => {
    if (!notification?._id || cleanedIdsRef.current.includes(notification._id)) {
      return;
    }

    setNotifications((current) => {
      const alreadyExists = current.some((item) => item._id === notification._id);
      if (alreadyExists) {
        return current.map((item) =>
          item._id === notification._id ? notification : item
        );
      }

      return [notification, ...current];
    });
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      if (!socketRef.current?.connected) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(fallbackInterval);
  }, [loadNotifications]);

  useEffect(() => {
    let mounted = true;
    let socket: Socket | null = null;

    const connectSocket = async () => {
      const email = await getCurrentUserEmail();
      if (!mounted || !email) return;

      socket = io(API_SOCKET_BASE_URL, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        query: { email },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(`[${Platform.OS}] [notificationsSocket] connected`, {
          email,
          socketId: socket?.id,
        });
      });

      socket.on("connect_error", (error) => {
        console.warn(
          `[${Platform.OS}] [notificationsSocket] connect error`,
          error?.message || error
        );
      });

      socket.on("notification:new", (notification: NotificationEntry) => {
        upsertNotification(notification);
      });

      socket.on(
        "notification:updated",
        ({ notification }: { notification: NotificationEntry }) => {
          upsertNotification(notification);
        }
      );

      socket.on("notification:read-all", () => {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, read: true }))
        );
      });
    };

    connectSocket().catch((error) => {
      console.warn(`[${Platform.OS}] [notificationsSocket] failed`, error);
    });

    return () => {
      mounted = false;
      socket?.removeAllListeners();
      socket?.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [upsertNotification]);

  const handleOpen = async () => {
    await loadNotifications();
    sheetRef.current?.show();
  };

  const handleNotificationPress = async (notification: NotificationEntry) => {
    try {
      const updated = await markNotificationAsRead(notification._id);
      setNotifications((current) =>
        current.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (error) {
      console.warn(`[${Platform.OS}] [notifications] failed to mark read`, error);
    }

    sheetRef.current?.hide();

    if (notification.type === "calendar_invite" && notification.meta?.eventId) {
      router.push({
        pathname: "/(tabs)/Calendar",
        params: { inviteEvent: notification.meta.eventId },
      });
      return;
    }

    if (notification.meta?.eventId) {
      router.push({
        pathname: "/(tabs)/Calendar",
        params: { event: notification.meta.eventId },
      });
      return;
    }

    if (
      notification.type === "user_invitation" ||
      notification.type === "invitation_response" ||
      notification.type === "friend_removed"
    ) {
      router.push({
        pathname: "/(tabs)/User",
        params: { section: "FRIENDS" },
      });
    }
  };

  const handleCleanNotifications = async () => {
    try {
      const cleanedIds = await getCleanedIds();
      const nextCleanedIds = Array.from(
        new Set([...cleanedIds, ...notifications.map((notification) => notification._id)])
      );
      await markAllNotificationsAsRead();
      await AsyncStorage.setItem(
        CLEANED_NOTIFICATIONS_KEY,
        JSON.stringify(nextCleanedIds)
      );
      cleanedIdsRef.current = nextCleanedIds;
      setNotifications([]);
    } catch (error) {
      console.warn(`[${Platform.OS}] [notifications] failed to clean`, error);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={handleOpen}>
        <Ionicons name="notifications" size={19} color="#111" />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <ActionSheet
        ref={sheetRef}
        containerStyle={{
          ...styles.sheetContainer,
          backgroundColor: "#efefef",
        }}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <Text style={styles.sheetSubtitle}>Calendar and friendship activity.</Text>
            </View>
            <TouchableOpacity
              style={[styles.cleanButton, notifications.length === 0 && styles.cleanButtonDisabled]}
              onPress={handleCleanNotifications}
              disabled={!notifications.length}
            >
              <Text style={styles.cleanButtonText}>Clean Notification</Text>
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color={GOLD} style={{ marginVertical: 20 }} /> : null}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} nestedScrollEnabled>
            {!loading && notifications.length === 0 ? (
              <Text style={styles.empty}>No notifications yet.</Text>
            ) : null}
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification._id}
                style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationTop}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ActionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: "absolute",
    top: 54,
    right: 18,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 99,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#111",
    fontSize: 10,
    fontWeight: "900",
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#cfcfcf",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "#111",
  },
  sheetSubtitle: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },
  cleanButton: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cleanButtonDisabled: {
    opacity: 0.45,
  },
  cleanButtonText: {
    color: "#111",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  list: {
    marginTop: 16,
    maxHeight: 430,
  },
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  empty: {
    color: "#666",
    paddingVertical: 24,
  },
  notificationCard: {
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 14,
  },
  notificationUnread: {
    borderWidth: 1,
    borderColor: GOLD,
  },
  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: GOLD,
  },
  notificationMessage: {
    marginTop: 6,
    fontSize: 13,
    color: "#111",
  },
  notificationDate: {
    marginTop: 8,
    fontSize: 11,
    color: "#777",
  },
});
