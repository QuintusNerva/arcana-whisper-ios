import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TarotService } from '../services/tarot.service';
import { Card, Reading } from '../models/card.model';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [energyCards, setEnergyCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isShuffling, setIsShuffling] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const tarotService = new TarotService();

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

    const loadDailyCard = useCallback(async () => {
        setIsShuffling(true);

        // Simulate shuffle animation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const reading = tarotService.getDailyReading();
        setCurrentCard(reading.cards[0]);

        // Load separate energy cards
        const energyReading = tarotService.getCustomReading('three-card', 'general');
        setEnergyCards(energyReading.cards);

        setIsShuffling(false);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadUserProfile();
        loadDailyCard();
    }, []);

    const handleDrawCard = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('CustomReading');
    };

    const handleViewCard = (card: Card) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('CardDetail', { card });
    };

    if (isLoading) {
        return (
            <LinearGradient colors={['#1a0b2e', '#2f1555']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffd700" />
                <Text style={styles.loadingText}>Opening the portal to the mystical realm...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#2d1b4e', '#1a0f2e']} style={styles.container}>
            <BlurView intensity={20} style={styles.header}>
                <Text style={styles.headerTitle}>
                    <Text style={styles.star}>✦</Text> ARCANA WHISPER <Text style={styles.star}>✦</Text>
                </Text>
            </BlurView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Daily Card Section */}
                {currentCard && (
                    <View style={styles.dailyCardContainer}>
                        <LinearGradient
                            colors={['#4a2c6d', '#6b4593']}
                            style={styles.dailyCardGradient}
                        >
                            <Text style={styles.sectionHeader}>Daily Reading</Text>
                            <TouchableOpacity
                                style={styles.dailyCardContent}
                                onPress={() => handleViewCard(currentCard)}
                            >
                                <Image
                                    source={{ uri: currentCard.image }}
                                    style={styles.mainCardImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.mainCardInfo}>
                                    <Text style={styles.mainCardName}>{currentCard.name}</Text>
                                    <Text style={styles.mainCardDesc} numberOfLines={3}>
                                        {currentCard.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

                {/* Affirmation */}
                <View style={styles.glassCard}>
                    <Text style={styles.glassHeader}>✨ Daily Affirmation</Text>
                    <View style={styles.affirmationBox}>
                        <Text style={styles.affirmationText}>
                            "I trust in the natural flow of my life. I embrace patience and know that everything unfolds in perfect timing."
                        </Text>
                    </View>
                </View>

                {/* Energy Cards */}
                <View style={styles.glassCard}>
                    <Text style={styles.glassHeader}>🌙 Today's Energy</Text>
                    <View style={styles.energyGrid}>
                        {energyCards.map((card, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.energyItem}
                                onPress={() => handleViewCard(card)}
                            >
                                <Image
                                    source={{ uri: card.image }}
                                    style={styles.energyCardImage}
                                />
                                <Text style={styles.energyLabel}>{['Mind', 'Body', 'Spirit'][index]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Action */}
                <TouchableOpacity style={styles.actionButton} onPress={handleDrawCard}>
                    <LinearGradient
                        colors={['#6b4593', '#8b5fbf']}
                        style={styles.actionGradient}
                    >
                        <Text style={styles.actionText}>➕ Draw Another Card</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Wisdom Tip */}
                <View style={styles.glassCard}>
                    <Text style={styles.glassHeader}>💡 Wisdom of the Day</Text>
                    <LinearGradient
                        colors={['#1a4d2e', '#2d5f3f']}
                        style={styles.wisdomCard}
                    >
                        <Text style={styles.wisdomSub}>Major Arcana Insight</Text>
                        <Text style={styles.wisdomText}>
                            The Temperance card represents the alchemical process of transformation. When this card appears, consider what aspects of your life need blending or balancing.
                        </Text>
                    </LinearGradient>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: 'white',
        marginTop: 20,
        fontSize: 16,
        fontFamily: 'CinzelDecorative',
        textAlign: 'center',
        opacity: 0.8,
    },
    header: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerTitle: {
        fontSize: 22,
        color: 'white',
        fontFamily: 'CinzelDecorative',
        letterSpacing: 3,
    },
    star: {
        color: '#ffd700',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    dailyCardContainer: {
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    dailyCardGradient: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 12,
        color: 'white',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 15,
        fontFamily: 'CinzelDecorative',
    },
    dailyCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    mainCardImage: {
        width: 100,
        height: 150,
        borderRadius: 10,
    },
    mainCardInfo: {
        flex: 1,
    },
    mainCardName: {
        fontSize: 20,
        color: 'white',
        fontFamily: 'CinzelDecorative',
        marginBottom: 8,
    },
    mainCardDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glassHeader: {
        fontSize: 16,
        color: 'white',
        marginBottom: 12,
        fontFamily: 'CinzelDecorative',
    },
    affirmationBox: {
        padding: 15,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#ffd700',
        borderRadius: 8,
    },
    affirmationText: {
        color: 'white',
        fontStyle: 'italic',
        lineHeight: 22,
        fontSize: 14,
    },
    energyGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginTop: 10,
    },
    energyItem: {
        alignItems: 'center',
    },
    energyCardImage: {
        width: 80,
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
    },
    energyLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'CinzelDecorative',
    },
    actionButton: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ffd700',
    },
    actionGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'CinzelDecorative',
    },
    wisdomCard: {
        padding: 15,
        borderRadius: 12,
    },
    wisdomSub: {
        fontSize: 12,
        color: '#9cffb5',
        marginBottom: 6,
        fontFamily: 'CinzelDecorative',
    },
    wisdomText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
    },
});
