import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { TarotService } from '../services/tarot.service';
import { Reading } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function HistoryScreen({ navigation }: any) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const tarotService = new TarotService();

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      const savedReadings = await tarotService.getSavedReadings();
      setReadings(savedReadings);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReading = (reading: Reading) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ReadingResult', { reading });
  };

  const handleViewCard = (card: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CardDetail', { card });
  };

  const renderReadingItem = ({ item }: { item: Reading }) => (
    <TouchableOpacity
      style={styles.readingCard}
      onPress={() => handleViewReading(item)}
      activeOpacity={0.8}
    >
      <View style={styles.readingHeader}>
        <Text style={styles.readingDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.readingType}>
          {item.spread.toUpperCase()} • {item.cards.length} card{item.cards.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      {item.question && (
        <Text style={styles.readingQuestion} numberOfLines={2}>
          "{item.question}"
        </Text>
      )}
      
      <View style={styles.cardsPreview}>
        {item.cards.slice(0, 3).map((card, index) => (
          <TouchableOpacity
            key={`${item.id}-${card.id}-${index}`}
            style={styles.cardPreview}
            onPress={() => handleViewCard(card)}
          >
            <Text style={styles.cardPreviewName} numberOfLines={1}>
              {card.name}
            </Text>
          </TouchableOpacity>
        ))}
        {item.cards.length > 3 && (
          <View style={styles.moreCards}>
            <Text style={styles.moreCardsText}>+{item.cards.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
        <BlurView intensity={20} style={styles.header}>
          <Text style={styles.headerTitle}>Reading History</Text>
        </BlurView>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your readings...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <BlurView intensity={20} style={styles.header}>
        <Text style={styles.headerTitle}>Reading History</Text>
      </BlurView>
      
      {readings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔮</Text>
          <Text style={styles.emptyTitle}>No Readings Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your tarot journey begins with your first reading
          </Text>
          <TouchableOpacity
            style={styles.startReadingButton}
            onPress={() => navigation.navigate('Draw')}
          >
            <LinearGradient
              colors={['#531CB3', '#9333EA']}
              style={styles.startReadingGradient}
            >
              <Text style={styles.startReadingText}>Start Your First Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={readings}
          renderItem={renderReadingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'CinzelDecorative',
  },
  listContent: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  readingCard: {
    backgroundColor: 'rgba(83, 28, 179, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'CinzelDecorative',
  },
  readingType: {
    fontSize: 12,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
  },
  readingQuestion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    minWidth: 80,
  },
  cardPreviewName: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CinzelDecorative',
  },
  moreCards: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCardsText: {
    fontSize: 12,
    color: '#9333EA',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  startReadingButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startReadingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  startReadingText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
