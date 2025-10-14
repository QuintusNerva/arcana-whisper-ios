import React, { useEffect } from 'react';
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
import { TarotService } from '../services/tarot.service';
import { Reading } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function ReadingResultScreen({ navigation, route }: any) {
  const { reading }: { reading: Reading } = route.params;
  const tarotService = new TarotService();

  useEffect(() => {
    // Save the reading
    tarotService.saveReading(reading);
    
    // Haptic feedback for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleViewCard = (card: any) => {
    navigation.navigate('CardDetail', { card });
  };

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <BlurView intensity={20} style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Reading</Text>
          <View style={styles.placeholder} />
        </BlurView>

        <View style={styles.content}>
          {/* Reading Info */}
          <View style={styles.readingInfo}>
            <Text style={styles.readingTitle}>{reading.spread.toUpperCase()} Reading</Text>
            {reading.question && (
              <Text style={styles.readingQuestion}>"{reading.question}"</Text>
            )}
            <Text style={styles.readingDate}>
              {new Date(reading.date).toLocaleDateString()}
            </Text>
          </View>

          {/* Cards */}
          <View style={styles.cardsContainer}>
            {reading.cards.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                style={styles.cardContainer}
                onPress={() => handleViewCard(card)}
                activeOpacity={0.8}
              >
                <View style={styles.card}>
                  <Image
                    source={{ uri: card.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{card.name}</Text>
                    <Text style={styles.cardPosition}>
                      {reading.spread === 'single' ? 'Your Guidance' : 
                       reading.spread === 'two-card' ? (index === 0 ? 'Situation' : 'Advice') :
                       reading.spread === 'three-card' ? (index === 0 ? 'Past' : index === 1 ? 'Present' : 'Future') :
                       `Position ${index + 1}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interpretation */}
          <View style={styles.interpretationContainer}>
            <Text style={styles.interpretationTitle}>Reading Interpretation</Text>
            <Text style={styles.interpretationText}>
              {reading.cards.length === 1 
                ? tarotService.getSingleCardInterpretation(reading.cards[0])
                : reading.cards.length === 3
                ? tarotService.getThreeCardInterpretation(reading.cards, reading.question, reading.theme)
                : 'Your reading reveals important insights about your current situation and path forward. Each card contributes its unique wisdom to guide you on your journey.'
              }
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Already saved in useEffect
              }}
            >
              <Text style={styles.saveButtonText}>✓ Saved to History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.newReadingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Draw');
              }}
            >
              <LinearGradient
                colors={['#531CB3', '#9333EA']}
                style={styles.newReadingGradient}
              >
                <Text style={styles.newReadingText}>New Reading</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  content: {
    padding: 16,
  },
  readingInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  readingTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  readingQuestion: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  readingDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'CinzelDecorative',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardContainer: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(83, 28, 179, 0.3)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardPosition: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  interpretationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  interpretationTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    marginBottom: 12,
    letterSpacing: 1,
  },
  interpretationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#22C55E',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
  },
  newReadingButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newReadingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  newReadingText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
