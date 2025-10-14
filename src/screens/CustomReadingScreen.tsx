import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { TarotService } from '../services/tarot.service';
import { SpreadType } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function CustomReadingScreen({ navigation }: any) {
  const [selectedSpread, setSelectedSpread] = useState<string>('single');
  const [selectedTheme, setSelectedTheme] = useState<string>('general');
  const [question, setQuestion] = useState<string>('');
  
  const tarotService = new TarotService();
  const availableSpreads = tarotService.getAvailableSpreads();

  const handleStartReading = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const reading = tarotService.getCustomReading(selectedSpread, selectedTheme, question);
      navigation.navigate('ReadingResult', { reading });
    } catch (error) {
      console.error('Error creating reading:', error);
    }
  };

  const themes = [
    { id: 'general', name: 'General Guidance', emoji: '🔮' },
    { id: 'love', name: 'Love & Relationships', emoji: '💕' },
    { id: 'career', name: 'Career & Work', emoji: '💼' },
    { id: 'growth', name: 'Personal Growth', emoji: '🌱' },
  ];

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <BlurView intensity={20} style={styles.header}>
          <Text style={styles.headerTitle}>Custom Reading</Text>
        </BlurView>

        <View style={styles.content}>
          {/* Question Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What would you like guidance on?</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Question (Optional)</Text>
              <View style={styles.textInput}>
                <Text style={styles.textInputText}>
                  {question || 'Ask the cards for guidance...'}
                </Text>
              </View>
            </View>
          </View>

          {/* Theme Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Focus</Text>
            <View style={styles.themeGrid}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    selectedTheme === theme.id && styles.selectedThemeCard
                  ]}
                  onPress={() => setSelectedTheme(theme.id)}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <Text style={[
                    styles.themeName,
                    selectedTheme === theme.id && styles.selectedThemeName
                  ]}>
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spread Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Spread</Text>
            <View style={styles.spreadList}>
              {availableSpreads.map((spread) => (
                <TouchableOpacity
                  key={spread.id}
                  style={[
                    styles.spreadCard,
                    selectedSpread === spread.id && styles.selectedSpreadCard
                  ]}
                  onPress={() => setSelectedSpread(spread.id)}
                >
                  <View style={styles.spreadHeader}>
                    <Text style={[
                      styles.spreadName,
                      selectedSpread === spread.id && styles.selectedSpreadName
                    ]}>
                      {spread.name}
                    </Text>
                    <View style={[
                      styles.availabilityBadge,
                      spread.available === 'free' && styles.freeBadge,
                      spread.available === 'premium' && styles.premiumBadge,
                      spread.available === 'ultimate' && styles.ultimateBadge,
                    ]}>
                      <Text style={styles.availabilityText}>
                        {spread.available.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.spreadDescription,
                    selectedSpread === spread.id && styles.selectedSpreadDescription
                  ]}>
                    {spread.description}
                  </Text>
                  <Text style={[
                    styles.spreadUseFor,
                    selectedSpread === spread.id && styles.selectedSpreadUseFor
                  ]}>
                    {spread.useFor}
                  </Text>
                  <Text style={[
                    styles.spreadCardCount,
                    selectedSpread === spread.id && styles.selectedSpreadCardCount
                  ]}>
                    {spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Reading Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartReading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#531CB3', '#9333EA']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Begin Your Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
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
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    marginBottom: 16,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: 'CinzelDecorative',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
    justifyContent: 'center',
  },
  textInputText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedThemeCard: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: '#9333EA',
  },
  themeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'CinzelDecorative',
  },
  selectedThemeName: {
    color: 'white',
  },
  spreadList: {
    gap: 12,
  },
  spreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedSpreadCard: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: '#9333EA',
  },
  spreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spreadName: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    flex: 1,
  },
  selectedSpreadName: {
    color: '#9333EA',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  premiumBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  ultimateBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  availabilityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  spreadDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  selectedSpreadDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  spreadUseFor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  selectedSpreadUseFor: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  spreadCardCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'CinzelDecorative',
  },
  selectedSpreadCardCount: {
    color: '#9333EA',
  },
  startButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
