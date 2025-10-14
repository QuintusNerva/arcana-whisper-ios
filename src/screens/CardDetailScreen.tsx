import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Card } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function CardDetailScreen({ navigation, route }: any) {
  const { card }: { card: Card } = route.params;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <BlurView intensity={20} style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Details</Text>
        <View style={styles.placeholder} />
      </BlurView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Card Image */}
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: card.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardType}>
              {card.arcanaType} {card.suit && `• ${card.suit}`}
            </Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
          </View>

          {/* Meanings */}
          <View style={styles.meaningsSection}>
            <Text style={styles.sectionTitle}>Meanings</Text>
            
            <View style={styles.meaningCard}>
              <View style={styles.meaningHeader}>
                <Text style={styles.meaningEmoji}>✨</Text>
                <Text style={styles.meaningTitle}>Upright</Text>
              </View>
              <Text style={styles.meaningText}>{card.meaning.upright}</Text>
            </View>

            <View style={styles.meaningCard}>
              <View style={styles.meaningHeader}>
                <Text style={styles.meaningEmoji}>🔄</Text>
                <Text style={styles.meaningTitle}>Reversed</Text>
              </View>
              <Text style={styles.meaningText}>{card.meaning.reversed}</Text>
            </View>
          </View>

          {/* Card Properties */}
          <View style={styles.propertiesSection}>
            <Text style={styles.sectionTitle}>Card Properties</Text>
            
            <View style={styles.propertiesGrid}>
              {card.element && (
                <View style={styles.propertyItem}>
                  <Text style={styles.propertyEmoji}>🌟</Text>
                  <Text style={styles.propertyLabel}>Element</Text>
                  <Text style={styles.propertyValue}>{card.element}</Text>
                </View>
              )}
              
              {card.zodiacSign && (
                <View style={styles.propertyItem}>
                  <Text style={styles.propertyEmoji}>⭐</Text>
                  <Text style={styles.propertyLabel}>Zodiac</Text>
                  <Text style={styles.propertyValue}>{card.zodiacSign}</Text>
                </View>
              )}
              
              {card.yesNoMaybe && (
                <View style={styles.propertyItem}>
                  <Text style={styles.propertyEmoji}>
                    {card.yesNoMaybe === 'yes' ? '✅' : 
                     card.yesNoMaybe === 'no' ? '❌' : '❓'}
                  </Text>
                  <Text style={styles.propertyLabel}>Yes/No</Text>
                  <Text style={styles.propertyValue}>
                    {card.yesNoMaybe.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Keywords */}
          {card.keywords && card.keywords.length > 0 && (
            <View style={styles.keywordsSection}>
              <Text style={styles.sectionTitle}>Keywords</Text>
              <View style={styles.keywordsContainer}>
                {card.keywords.map((keyword, index) => (
                  <View key={index} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Daily Guidance */}
          {card.dailyGuidance && (
            <View style={styles.guidanceSection}>
              <Text style={styles.sectionTitle}>Daily Guidance</Text>
              <View style={styles.guidanceCard}>
                <View style={styles.guidanceHeader}>
                  <Text style={styles.guidanceEmoji}>🌟</Text>
                  <Text style={styles.guidanceTitle}>Today's Message</Text>
                </View>
                <Text style={styles.guidanceText}>{card.dailyGuidance}</Text>
              </View>
            </View>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: '700',
    letterSpacing: 2,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 100,
  },
  content: {
    padding: 16,
  },
  cardImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardImage: {
    width: width - 64,
    height: (width - 64) * 1.5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardName: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardType: {
    fontSize: 16,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
    marginBottom: 16,
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  meaningsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    marginBottom: 16,
    letterSpacing: 1,
  },
  meaningCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  meaningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meaningEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  meaningTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    letterSpacing: 1,
  },
  meaningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  propertiesSection: {
    marginBottom: 32,
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  propertyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  propertyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'CinzelDecorative',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
  },
  keywordsSection: {
    marginBottom: 32,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordTag: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  keywordText: {
    fontSize: 12,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
  },
  guidanceSection: {
    marginBottom: 32,
  },
  guidanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidanceEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  guidanceTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    letterSpacing: 1,
  },
  guidanceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
