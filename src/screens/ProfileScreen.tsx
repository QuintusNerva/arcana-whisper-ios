import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleUpgrade = (plan: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Upgrade to ' + plan.charAt(0).toUpperCase() + plan.slice(1),
      'This feature will be available in a future update!',
      [{ text: 'OK' }]
    );
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Edit Profile', 'This feature will be available in a future update!');
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkMode(!darkMode);
    Alert.alert('Theme Changed', `Dark mode ${!darkMode ? 'enabled' : 'disabled'}`);
  };

  const handleNotificationsToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(!notifications);
    Alert.alert('Notifications', `Notifications ${!notifications ? 'enabled' : 'disabled'}`);
  };

  const handleHelpSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Help & Support', 'Contact us at support@arcanawhisper.com');
  };

  const handlePrivacySecurity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Privacy & Security', 'Your data is encrypted and secure.');
  };

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <BlurView intensity={20} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </BlurView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🔮</Text>
          </View>
          <Text style={styles.userName}>
            {userProfile?.name || 'Mystic Seeker'}
          </Text>
          <Text style={styles.userSubscription}>
            {userProfile?.subscription?.toUpperCase() || 'FREE'} Plan
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
            <Text style={styles.settingIcon}>👤</Text>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingIcon}>🌙</Text>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#9333EA' }}
              thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#9333EA' }}
              thumbColor={notifications ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySecurity}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingLabel}>Privacy & Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>Current Plan</Text>
            <Text style={styles.subscriptionPlan}>
              {userProfile?.subscription?.toUpperCase() || 'FREE'}
            </Text>
            <Text style={styles.subscriptionDescription}>
              {userProfile?.subscription === 'premium' 
                ? 'Access to premium spreads and features'
                : userProfile?.subscription === 'ultimate'
                ? 'Full access to all features and spreads'
                : 'Basic features and free spreads'
              }
            </Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => handleUpgrade('premium')}
          >
            <LinearGradient
              colors={['#531CB3', '#9333EA']}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>⭐</Text>
            <Text style={styles.settingLabel}>Rate the App</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📧</Text>
            <Text style={styles.settingLabel}>Contact Us</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appVersion}>Arcana Whisper v1.0.0</Text>
          <Text style={styles.appDescription}>
            Your mystical journey through the tarot
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: '700',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  userSubscription: {
    fontSize: 14,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    marginBottom: 16,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'CinzelDecorative',
  },
  settingArrow: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  subscriptionSection: {
    marginBottom: 32,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(83, 28, 179, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  subscriptionTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'CinzelDecorative',
    marginBottom: 4,
  },
  subscriptionPlan: {
    fontSize: 24,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  supportSection: {
    marginBottom: 32,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'CinzelDecorative',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
});
