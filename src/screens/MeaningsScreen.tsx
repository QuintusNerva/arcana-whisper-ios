import React, { useState } from 'react';
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
import { Card } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function MeaningsScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const tarotService = new TarotService();
  const allCards = tarotService.getAllCards();

  const categories = [
    { id: 'all', name: 'All Cards', emoji: '🔮' },
    { id: 'Major', name: 'Major Arcana', emoji: '✨' },
    { id: 'Cups', name: 'Cups', emoji: '💧' },
    { id: 'Pentacles', name: 'Pentacles', emoji: '💰' },
    { id: 'Swords', name: 'Swords', emoji: '⚔️' },
    { id: 'Wands', name: 'Wands', emoji: '🔥' },
  ];

  const filteredCards = allCards.filter(card => {
    const matchesCategory = selectedCategory === 'all' || 
                           card.arcanaType === selectedCategory || 
                           card.suit === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                         card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.keywords?.some(keyword => 
                           keyword.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    return matchesCategory && matchesSearch;
  });

  const handleViewCard = (card: Card) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CardDetail', { card });
  };

  const renderCardItem = ({ item }: { item: Card }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => handleViewCard(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <Text style={styles.cardEmoji}>
          {item.arcanaType === 'Major' ? '✨' : 
           item.suit === 'Cups' ? '💧' :
           item.suit === 'Pentacles' ? '💰' :
           item.suit === 'Swords' ? '⚔️' : '🔥'}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardMeta}>
          {item.element && (
            <Text style={styles.cardMetaText}>{item.element}</Text>
          )}
          {item.zodiacSign && (
            <Text style={styles.cardMetaText}>• {item.zodiacSign}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.container}>
      <BlurView intensity={20} style={styles.header}>
        <Text style={styles.headerTitle}>Card Meanings</Text>
      </BlurView>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategoryButton
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(category.id);
                }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.selectedCategoryName
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Text style={styles.searchPlaceholder}>
              {searchQuery || 'Search cards...'}
            </Text>
          </View>
        </View>

        {/* Cards List */}
        <View style={styles.cardsContainer}>
          <Text style={styles.cardsCount}>
            {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} found
          </Text>
          
          <FlatList
            data={filteredCards}
            renderItem={renderCardItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  selectedCategoryButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: '#9333EA',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'CinzelDecorative',
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: 'white',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchPlaceholder: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  cardsCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'CinzelDecorative',
    marginBottom: 16,
  },
  cardItem: {
    backgroundColor: 'rgba(83, 28, 179, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'CinzelDecorative',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'CinzelDecorative',
  },
});
