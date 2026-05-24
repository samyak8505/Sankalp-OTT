import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setShowModal, dismissNotification, markNotificationAsRead } from '../redux/slices/notificationSlice';
import { theme } from '../constants/theme';
import { X } from 'lucide-react-native';

export default function NotificationModal() {
  const dispatch = useDispatch();
  const { pending, showModal } = useSelector((state) => state.notifications);

  const handleDismiss = (notificationId) => {
    dispatch(dismissNotification(notificationId));
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleCloseModal = () => {
    if (pending.length === 0) {
      dispatch(setShowModal(false));
    }
  };

  if (!showModal || pending.length === 0) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showModal}
      onRequestClose={handleCloseModal}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notification</Text>
            <Pressable
              onPress={handleCloseModal}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={20} color={theme.gray} />
            </Pressable>
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {pending.map((notification, index) => (
              <View key={notification.id || index} style={styles.notificationCard}>
                {/* Icon/Badge */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>
                    {notification.type === 'drama' ? '🎬' : '📢'}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationBody} numberOfLines={3}>
                    {notification.body}
                  </Text>
                  {notification.drama_id && (
                    <Text style={styles.dramaInfo}>Drama notification</Text>
                  )}
                </View>

                {/* Action Button */}
                <Pressable
                  onPress={() => handleDismiss(notification.id)}
                  style={({ pressed }) => [
                    styles.dismissButton,
                    pressed && styles.dismissButtonPressed,
                  ]}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleCloseModal}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Text style={styles.closeButtonText}>
                {pending.length > 1 ? `Close (${pending.length - 1} remaining)` : 'Close'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 400,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.deepBlack,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.crimson,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.white,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: theme.gray,
    lineHeight: 16,
  },
  dramaInfo: {
    fontSize: 10,
    color: theme.crimson,
    marginTop: 6,
  },
  dismissButton: {
    backgroundColor: theme.crimson,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  dismissButtonPressed: {
    opacity: 0.8,
  },
  dismissButtonText: {
    color: theme.white,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeButton: {
    backgroundColor: theme.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
