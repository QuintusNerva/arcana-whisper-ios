/**
 * Cities Database — Major world cities with lat/lng and UTC offset.
 * Used for natal chart calculations to determine timezone and coordinates
 * from a user's birth location selection.
 */

export interface CityData {
    name: string;
    lat: number;
    lng: number;
    utcOffset: number;
}

/**
 * ~400 major world cities organized by region.
 * UTC offsets represent standard time (not DST).
 */
export const CITIES: CityData[] = [
    // ══════════════════════════════════
    // NORTH AMERICA — United States
    // ══════════════════════════════════
    { name: 'New York, NY, USA', lat: 40.7128, lng: -74.0060, utcOffset: -5 },
    { name: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437, utcOffset: -8 },
    { name: 'Chicago, IL, USA', lat: 41.8781, lng: -87.6298, utcOffset: -6 },
    { name: 'Houston, TX, USA', lat: 29.7604, lng: -95.3698, utcOffset: -6 },
    { name: 'Phoenix, AZ, USA', lat: 33.4484, lng: -112.0740, utcOffset: -7 },
    { name: 'Philadelphia, PA, USA', lat: 39.9526, lng: -75.1652, utcOffset: -5 },
    { name: 'San Antonio, TX, USA', lat: 29.4241, lng: -98.4936, utcOffset: -6 },
    { name: 'San Diego, CA, USA', lat: 32.7157, lng: -117.1611, utcOffset: -8 },
    { name: 'Dallas, TX, USA', lat: 32.7767, lng: -96.7970, utcOffset: -6 },
    { name: 'San Jose, CA, USA', lat: 37.3382, lng: -121.8863, utcOffset: -8 },
    { name: 'Austin, TX, USA', lat: 30.2672, lng: -97.7431, utcOffset: -6 },
    { name: 'Jacksonville, FL, USA', lat: 30.3322, lng: -81.6557, utcOffset: -5 },
    { name: 'Fort Worth, TX, USA', lat: 32.7555, lng: -97.3308, utcOffset: -6 },
    { name: 'Columbus, OH, USA', lat: 39.9612, lng: -82.9988, utcOffset: -5 },
    { name: 'Charlotte, NC, USA', lat: 35.2271, lng: -80.8431, utcOffset: -5 },
    { name: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194, utcOffset: -8 },
    { name: 'Indianapolis, IN, USA', lat: 39.7684, lng: -86.1581, utcOffset: -5 },
    { name: 'Seattle, WA, USA', lat: 47.6062, lng: -122.3321, utcOffset: -8 },
    { name: 'Denver, CO, USA', lat: 39.7392, lng: -104.9903, utcOffset: -7 },
    { name: 'Washington, DC, USA', lat: 38.9072, lng: -77.0369, utcOffset: -5 },
    { name: 'Nashville, TN, USA', lat: 36.1627, lng: -86.7816, utcOffset: -6 },
    { name: 'Oklahoma City, OK, USA', lat: 35.4676, lng: -97.5164, utcOffset: -6 },
    { name: 'El Paso, TX, USA', lat: 31.7619, lng: -106.4850, utcOffset: -7 },
    { name: 'Boston, MA, USA', lat: 42.3601, lng: -71.0589, utcOffset: -5 },
    { name: 'Portland, OR, USA', lat: 45.5152, lng: -122.6784, utcOffset: -8 },
    { name: 'Las Vegas, NV, USA', lat: 36.1699, lng: -115.1398, utcOffset: -8 },
    { name: 'Memphis, TN, USA', lat: 35.1495, lng: -90.0490, utcOffset: -6 },
    { name: 'Louisville, KY, USA', lat: 38.2527, lng: -85.7585, utcOffset: -5 },
    { name: 'Baltimore, MD, USA', lat: 39.2904, lng: -76.6122, utcOffset: -5 },
    { name: 'Milwaukee, WI, USA', lat: 43.0389, lng: -87.9065, utcOffset: -6 },
    { name: 'Albuquerque, NM, USA', lat: 35.0844, lng: -106.6504, utcOffset: -7 },
    { name: 'Tucson, AZ, USA', lat: 32.2226, lng: -110.9747, utcOffset: -7 },
    { name: 'Fresno, CA, USA', lat: 36.7378, lng: -119.7871, utcOffset: -8 },
    { name: 'Sacramento, CA, USA', lat: 38.5816, lng: -121.4944, utcOffset: -8 },
    { name: 'Mesa, AZ, USA', lat: 33.4152, lng: -111.8315, utcOffset: -7 },
    { name: 'Kansas City, MO, USA', lat: 39.0997, lng: -94.5786, utcOffset: -6 },
    { name: 'Atlanta, GA, USA', lat: 33.7490, lng: -84.3880, utcOffset: -5 },
    { name: 'Omaha, NE, USA', lat: 41.2565, lng: -95.9345, utcOffset: -6 },
    { name: 'Colorado Springs, CO, USA', lat: 38.8339, lng: -104.8214, utcOffset: -7 },
    { name: 'Raleigh, NC, USA', lat: 35.7796, lng: -78.6382, utcOffset: -5 },
    { name: 'Miami, FL, USA', lat: 25.7617, lng: -80.1918, utcOffset: -5 },
    { name: 'Minneapolis, MN, USA', lat: 44.9778, lng: -93.2650, utcOffset: -6 },
    { name: 'Cleveland, OH, USA', lat: 41.4993, lng: -81.6944, utcOffset: -5 },
    { name: 'Tampa, FL, USA', lat: 27.9506, lng: -82.4572, utcOffset: -5 },
    { name: 'New Orleans, LA, USA', lat: 29.9511, lng: -90.0715, utcOffset: -6 },
    { name: 'Pittsburgh, PA, USA', lat: 40.4406, lng: -79.9959, utcOffset: -5 },
    { name: 'Cincinnati, OH, USA', lat: 39.1031, lng: -84.5120, utcOffset: -5 },
    { name: 'St. Louis, MO, USA', lat: 38.6270, lng: -90.1994, utcOffset: -6 },
    { name: 'Orlando, FL, USA', lat: 28.5383, lng: -81.3792, utcOffset: -5 },
    { name: 'Detroit, MI, USA', lat: 42.3314, lng: -83.0458, utcOffset: -5 },
    { name: 'Honolulu, HI, USA', lat: 21.3069, lng: -157.8583, utcOffset: -10 },
    { name: 'Anchorage, AK, USA', lat: 61.2181, lng: -149.9003, utcOffset: -9 },
    { name: 'Salt Lake City, UT, USA', lat: 40.7608, lng: -111.8910, utcOffset: -7 },
    { name: 'Richmond, VA, USA', lat: 37.5407, lng: -77.4360, utcOffset: -5 },
    { name: 'Boise, ID, USA', lat: 43.6150, lng: -116.2023, utcOffset: -7 },

    // NORTH AMERICA — Canada
    { name: 'Toronto, ON, Canada', lat: 43.6532, lng: -79.3832, utcOffset: -5 },
    { name: 'Montreal, QC, Canada', lat: 45.5017, lng: -73.5673, utcOffset: -5 },
    { name: 'Vancouver, BC, Canada', lat: 49.2827, lng: -123.1207, utcOffset: -8 },
    { name: 'Calgary, AB, Canada', lat: 51.0447, lng: -114.0719, utcOffset: -7 },
    { name: 'Edmonton, AB, Canada', lat: 53.5461, lng: -113.4938, utcOffset: -7 },
    { name: 'Ottawa, ON, Canada', lat: 45.4215, lng: -75.6972, utcOffset: -5 },
    { name: 'Winnipeg, MB, Canada', lat: 49.8951, lng: -97.1384, utcOffset: -6 },
    { name: 'Halifax, NS, Canada', lat: 44.6488, lng: -63.5752, utcOffset: -4 },

    // NORTH AMERICA — Mexico & Caribbean
    { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332, utcOffset: -6 },
    { name: 'Guadalajara, Mexico', lat: 20.6597, lng: -103.3496, utcOffset: -6 },
    { name: 'Monterrey, Mexico', lat: 25.6866, lng: -100.3161, utcOffset: -6 },
    { name: 'Havana, Cuba', lat: 23.1136, lng: -82.3666, utcOffset: -5 },
    { name: 'San Juan, Puerto Rico', lat: 18.4655, lng: -66.1057, utcOffset: -4 },
    { name: 'Kingston, Jamaica', lat: 18.0179, lng: -76.8099, utcOffset: -5 },
    { name: 'Santo Domingo, Dominican Republic', lat: 18.4861, lng: -69.9312, utcOffset: -4 },
    { name: 'Panama City, Panama', lat: 8.9824, lng: -79.5199, utcOffset: -5 },
    { name: 'San José, Costa Rica', lat: 9.9281, lng: -84.0907, utcOffset: -6 },
    { name: 'Guatemala City, Guatemala', lat: 14.6349, lng: -90.5069, utcOffset: -6 },

    // ══════════════════════════════════
    // SOUTH AMERICA
    // ══════════════════════════════════
    { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333, utcOffset: -3 },
    { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729, utcOffset: -3 },
    { name: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816, utcOffset: -3 },
    { name: 'Bogotá, Colombia', lat: 4.7110, lng: -74.0721, utcOffset: -5 },
    { name: 'Lima, Peru', lat: -12.0464, lng: -77.0428, utcOffset: -5 },
    { name: 'Santiago, Chile', lat: -33.4489, lng: -70.6693, utcOffset: -4 },
    { name: 'Caracas, Venezuela', lat: 10.4806, lng: -66.9036, utcOffset: -4 },
    { name: 'Medellín, Colombia', lat: 6.2442, lng: -75.5812, utcOffset: -5 },
    { name: 'Quito, Ecuador', lat: -0.1807, lng: -78.4678, utcOffset: -5 },
    { name: 'Montevideo, Uruguay', lat: -34.9011, lng: -56.1645, utcOffset: -3 },
    { name: 'La Paz, Bolivia', lat: -16.4897, lng: -68.1193, utcOffset: -4 },
    { name: 'Asunción, Paraguay', lat: -25.2637, lng: -57.5759, utcOffset: -4 },

    // ══════════════════════════════════
    // EUROPE — Western
    // ══════════════════════════════════
    { name: 'London, United Kingdom', lat: 51.5074, lng: -0.1278, utcOffset: 0 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522, utcOffset: 1 },
    { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050, utcOffset: 1 },
    { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038, utcOffset: 1 },
    { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964, utcOffset: 1 },
    { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041, utcOffset: 1 },
    { name: 'Brussels, Belgium', lat: 50.8503, lng: 4.3517, utcOffset: 1 },
    { name: 'Vienna, Austria', lat: 48.2082, lng: 16.3738, utcOffset: 1 },
    { name: 'Zurich, Switzerland', lat: 47.3769, lng: 8.5417, utcOffset: 1 },
    { name: 'Munich, Germany', lat: 48.1351, lng: 11.5820, utcOffset: 1 },
    { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734, utcOffset: 1 },
    { name: 'Milan, Italy', lat: 45.4642, lng: 9.1900, utcOffset: 1 },
    { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393, utcOffset: 0 },
    { name: 'Dublin, Ireland', lat: 53.3498, lng: -6.2603, utcOffset: 0 },
    { name: 'Hamburg, Germany', lat: 53.5511, lng: 9.9937, utcOffset: 1 },
    { name: 'Glasgow, Scotland, UK', lat: 55.8642, lng: -4.2518, utcOffset: 0 },
    { name: 'Edinburgh, Scotland, UK', lat: 55.9533, lng: -3.1883, utcOffset: 0 },
    { name: 'Manchester, UK', lat: 53.4808, lng: -2.2426, utcOffset: 0 },
    { name: 'Lyon, France', lat: 45.7640, lng: 4.8357, utcOffset: 1 },
    { name: 'Marseille, France', lat: 43.2965, lng: 5.3698, utcOffset: 1 },
    { name: 'Copenhagen, Denmark', lat: 55.6761, lng: 12.5683, utcOffset: 1 },
    { name: 'Oslo, Norway', lat: 59.9139, lng: 10.7522, utcOffset: 1 },
    { name: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686, utcOffset: 1 },
    { name: 'Helsinki, Finland', lat: 60.1699, lng: 24.9384, utcOffset: 2 },
    { name: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.9426, utcOffset: 0 },

    // EUROPE — Eastern
    { name: 'Warsaw, Poland', lat: 52.2297, lng: 21.0122, utcOffset: 1 },
    { name: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378, utcOffset: 1 },
    { name: 'Budapest, Hungary', lat: 47.4979, lng: 19.0402, utcOffset: 1 },
    { name: 'Bucharest, Romania', lat: 44.4268, lng: 26.1025, utcOffset: 2 },
    { name: 'Athens, Greece', lat: 37.9838, lng: 23.7275, utcOffset: 2 },
    { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, utcOffset: 3 },
    { name: 'Ankara, Turkey', lat: 39.9334, lng: 32.8597, utcOffset: 3 },
    { name: 'Kyiv, Ukraine', lat: 50.4501, lng: 30.5234, utcOffset: 2 },
    { name: 'Moscow, Russia', lat: 55.7558, lng: 37.6173, utcOffset: 3 },
    { name: 'St. Petersburg, Russia', lat: 59.9311, lng: 30.3609, utcOffset: 3 },
    { name: 'Belgrade, Serbia', lat: 44.7866, lng: 20.4489, utcOffset: 1 },
    { name: 'Sofia, Bulgaria', lat: 42.6977, lng: 23.3219, utcOffset: 2 },
    { name: 'Zagreb, Croatia', lat: 45.8150, lng: 15.9819, utcOffset: 1 },
    { name: 'Bratislava, Slovakia', lat: 48.1486, lng: 17.1077, utcOffset: 1 },
    { name: 'Riga, Latvia', lat: 56.9496, lng: 24.1052, utcOffset: 2 },
    { name: 'Vilnius, Lithuania', lat: 54.6872, lng: 25.2797, utcOffset: 2 },
    { name: 'Tallinn, Estonia', lat: 59.4370, lng: 24.7536, utcOffset: 2 },

    // ══════════════════════════════════
    // AFRICA
    // ══════════════════════════════════
    { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792, utcOffset: 1 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, utcOffset: 2 },
    { name: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473, utcOffset: 2 },
    { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241, utcOffset: 2 },
    { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219, utcOffset: 3 },
    { name: 'Casablanca, Morocco', lat: 33.5731, lng: -7.5898, utcOffset: 1 },
    { name: 'Accra, Ghana', lat: 5.6037, lng: -0.1870, utcOffset: 0 },
    { name: 'Addis Ababa, Ethiopia', lat: 9.0250, lng: 38.7469, utcOffset: 3 },
    { name: 'Kinshasa, DR Congo', lat: -4.4419, lng: 15.2663, utcOffset: 1 },
    { name: 'Dar es Salaam, Tanzania', lat: -6.7924, lng: 39.2083, utcOffset: 3 },
    { name: 'Algiers, Algeria', lat: 36.7538, lng: 3.0588, utcOffset: 1 },
    { name: 'Tunis, Tunisia', lat: 36.8065, lng: 10.1815, utcOffset: 1 },
    { name: 'Dakar, Senegal', lat: 14.7167, lng: -17.4677, utcOffset: 0 },
    { name: 'Kampala, Uganda', lat: 0.3476, lng: 32.5825, utcOffset: 3 },
    { name: 'Lusaka, Zambia', lat: -15.3875, lng: 28.3228, utcOffset: 2 },
    { name: 'Harare, Zimbabwe', lat: -17.8252, lng: 31.0335, utcOffset: 2 },
    { name: 'Maputo, Mozambique', lat: -25.9692, lng: 32.5732, utcOffset: 2 },
    { name: 'Abuja, Nigeria', lat: 9.0765, lng: 7.3986, utcOffset: 1 },

    // ══════════════════════════════════
    // MIDDLE EAST
    // ══════════════════════════════════
    { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, utcOffset: 4 },
    { name: 'Abu Dhabi, UAE', lat: 24.4539, lng: 54.3773, utcOffset: 4 },
    { name: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753, utcOffset: 3 },
    { name: 'Jeddah, Saudi Arabia', lat: 21.4858, lng: 39.1925, utcOffset: 3 },
    { name: 'Tehran, Iran', lat: 35.6892, lng: 51.3890, utcOffset: 3.5 },
    { name: 'Tel Aviv, Israel', lat: 32.0853, lng: 34.7818, utcOffset: 2 },
    { name: 'Jerusalem, Israel', lat: 31.7683, lng: 35.2137, utcOffset: 2 },
    { name: 'Beirut, Lebanon', lat: 33.8938, lng: 35.5018, utcOffset: 2 },
    { name: 'Amman, Jordan', lat: 31.9454, lng: 35.9284, utcOffset: 3 },
    { name: 'Baghdad, Iraq', lat: 33.3152, lng: 44.3661, utcOffset: 3 },
    { name: 'Kuwait City, Kuwait', lat: 29.3759, lng: 47.9774, utcOffset: 3 },
    { name: 'Doha, Qatar', lat: 25.2854, lng: 51.5310, utcOffset: 3 },
    { name: 'Muscat, Oman', lat: 23.5880, lng: 58.3829, utcOffset: 4 },
    { name: 'Manama, Bahrain', lat: 26.2285, lng: 50.5860, utcOffset: 3 },

    // ══════════════════════════════════
    // SOUTH ASIA
    // ══════════════════════════════════
    { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777, utcOffset: 5.5 },
    { name: 'Delhi, India', lat: 28.7041, lng: 77.1025, utcOffset: 5.5 },
    { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946, utcOffset: 5.5 },
    { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867, utcOffset: 5.5 },
    { name: 'Chennai, India', lat: 13.0827, lng: 80.2707, utcOffset: 5.5 },
    { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639, utcOffset: 5.5 },
    { name: 'Pune, India', lat: 18.5204, lng: 73.8567, utcOffset: 5.5 },
    { name: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714, utcOffset: 5.5 },
    { name: 'Jaipur, India', lat: 26.9124, lng: 75.7873, utcOffset: 5.5 },
    { name: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011, utcOffset: 5 },
    { name: 'Lahore, Pakistan', lat: 31.5204, lng: 74.3587, utcOffset: 5 },
    { name: 'Islamabad, Pakistan', lat: 33.6844, lng: 73.0479, utcOffset: 5 },
    { name: 'Dhaka, Bangladesh', lat: 23.8103, lng: 90.4125, utcOffset: 6 },
    { name: 'Colombo, Sri Lanka', lat: 6.9271, lng: 79.8612, utcOffset: 5.5 },
    { name: 'Kathmandu, Nepal', lat: 27.7172, lng: 85.3240, utcOffset: 5.75 },

    // ══════════════════════════════════
    // EAST ASIA
    // ══════════════════════════════════
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, utcOffset: 9 },
    { name: 'Osaka, Japan', lat: 34.6937, lng: 135.5023, utcOffset: 9 },
    { name: 'Kyoto, Japan', lat: 35.0116, lng: 135.7681, utcOffset: 9 },
    { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780, utcOffset: 9 },
    { name: 'Busan, South Korea', lat: 35.1796, lng: 129.0756, utcOffset: 9 },
    { name: 'Beijing, China', lat: 39.9042, lng: 116.4074, utcOffset: 8 },
    { name: 'Shanghai, China', lat: 31.2304, lng: 121.4737, utcOffset: 8 },
    { name: 'Guangzhou, China', lat: 23.1291, lng: 113.2644, utcOffset: 8 },
    { name: 'Shenzhen, China', lat: 22.5431, lng: 114.0579, utcOffset: 8 },
    { name: 'Chengdu, China', lat: 30.5728, lng: 104.0668, utcOffset: 8 },
    { name: 'Wuhan, China', lat: 30.5928, lng: 114.3055, utcOffset: 8 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, utcOffset: 8 },
    { name: 'Taipei, Taiwan', lat: 25.0330, lng: 121.5654, utcOffset: 8 },
    { name: 'Ulaanbaatar, Mongolia', lat: 47.8864, lng: 106.9057, utcOffset: 8 },

    // ══════════════════════════════════
    // SOUTHEAST ASIA
    // ══════════════════════════════════
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, utcOffset: 8 },
    { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018, utcOffset: 7 },
    { name: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456, utcOffset: 7 },
    { name: 'Bali, Indonesia', lat: -8.3405, lng: 115.0920, utcOffset: 8 },
    { name: 'Manila, Philippines', lat: 14.5995, lng: 120.9842, utcOffset: 8 },
    { name: 'Ho Chi Minh City, Vietnam', lat: 10.8231, lng: 106.6297, utcOffset: 7 },
    { name: 'Hanoi, Vietnam', lat: 21.0278, lng: 105.8342, utcOffset: 7 },
    { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869, utcOffset: 8 },
    { name: 'Yangon, Myanmar', lat: 16.8661, lng: 96.1951, utcOffset: 6.5 },
    { name: 'Phnom Penh, Cambodia', lat: 11.5564, lng: 104.9282, utcOffset: 7 },

    // ══════════════════════════════════
    // CENTRAL ASIA
    // ══════════════════════════════════
    { name: 'Tashkent, Uzbekistan', lat: 41.2995, lng: 69.2401, utcOffset: 5 },
    { name: 'Almaty, Kazakhstan', lat: 43.2220, lng: 76.8512, utcOffset: 6 },
    { name: 'Nur-Sultan, Kazakhstan', lat: 51.1605, lng: 71.4704, utcOffset: 6 },
    { name: 'Tbilisi, Georgia', lat: 41.7151, lng: 44.8271, utcOffset: 4 },
    { name: 'Baku, Azerbaijan', lat: 40.4093, lng: 49.8671, utcOffset: 4 },
    { name: 'Yerevan, Armenia', lat: 40.1792, lng: 44.4991, utcOffset: 4 },

    // ══════════════════════════════════
    // OCEANIA
    // ══════════════════════════════════
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, utcOffset: 10 },
    { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631, utcOffset: 10 },
    { name: 'Brisbane, Australia', lat: -27.4698, lng: 153.0251, utcOffset: 10 },
    { name: 'Perth, Australia', lat: -31.9505, lng: 115.8605, utcOffset: 8 },
    { name: 'Adelaide, Australia', lat: -34.9285, lng: 138.6007, utcOffset: 9.5 },
    { name: 'Auckland, New Zealand', lat: -36.8485, lng: 174.7633, utcOffset: 12 },
    { name: 'Wellington, New Zealand', lat: -41.2865, lng: 174.7762, utcOffset: 12 },
    { name: 'Christchurch, New Zealand', lat: -43.5321, lng: 172.6362, utcOffset: 12 },
    { name: 'Suva, Fiji', lat: -18.1416, lng: 178.4419, utcOffset: 12 },
    { name: 'Port Moresby, Papua New Guinea', lat: -6.3149, lng: 143.9556, utcOffset: 10 },
];

/**
 * Search cities by name (case-insensitive fuzzy match).
 * Returns top N matches sorted by relevance.
 */
export function searchCities(query: string, limit: number = 10): CityData[] {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase().trim();

    // Score each city
    const scored = CITIES.map(city => {
        const name = city.name.toLowerCase();
        let score = 0;

        // Exact start match = highest
        if (name.startsWith(q)) score = 100;
        // City name (before comma) starts with query
        else if (name.split(',')[0].trim().startsWith(q)) score = 90;
        // Contains query
        else if (name.includes(q)) score = 50;
        // Individual words match
        else {
            const words = name.split(/[\s,]+/);
            for (const word of words) {
                if (word.startsWith(q)) { score = 40; break; }
            }
        }

        return { city, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.city);
}
