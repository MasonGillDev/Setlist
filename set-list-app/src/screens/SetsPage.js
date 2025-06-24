import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import FirebaseService from '../services/FirebaseService';
import { Colors } from '../constants/colors';
import TrackItem from '../components/TrackItem';
import { useAuth } from '../hooks/useAuth';

const SetsPage = () => {
  const [setlists, setSetlists] = useState([]);
  const [expandedSetlists, setExpandedSetlists] = useState({});
  const [setlistTracks, setSetlistTracks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation values for each setlist
  const animatedValues = useRef({});
  
  const { user, logout } = useAuth();
  const userId = user?.uid || 'guest';

  useEffect(() => {
    loadSetlists();
  }, []);

  // Reload setlists when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[SetsPage] Screen focused, reloading setlists...');
      loadSetlists();
    }, [])
  );

  const loadSetlists = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get all setlists for demo purposes
      const allSetlists = await FirebaseService.getAllSetlists();
      console.log('[SetsPage] Loaded setlists:', allSetlists.length);
      setSetlists(allSetlists);
    } catch (err) {
      console.error('[SetsPage] Error loading setlists:', err);
      setError('Failed to load setlists');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetlist = async (setlistId) => {
    const isExpanded = expandedSetlists[setlistId];
    
    if (!isExpanded && !setlistTracks[setlistId]) {
      // Load tracks for this setlist
      try {
        // Find the setlist to check if it's global
        const setlist = setlists.find(s => s.id === setlistId);
        const isGlobal = setlist?.isGlobal || false;
        
        const tracks = isGlobal 
          ? await FirebaseService.getGlobalSetTracks(setlistId)
          : await FirebaseService.getSetlistTracks(setlistId);
          
        setSetlistTracks(prev => ({
          ...prev,
          [setlistId]: tracks
        }));
      } catch (err) {
        console.error('[SetsPage] Error loading tracks:', err);
      }
    }
    
    setExpandedSetlists(prev => ({
      ...prev,
      [setlistId]: !isExpanded
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const openSpotify = async (track) => {
    try {
      // Check if track has Spotify data in acrCloudData
      const spotifyId = track.acrCloudData?.external_metadata?.spotify?.track?.id;
      
      if (spotifyId) {
        // Try to open in Spotify app first
        const spotifyUri = `spotify:track:${spotifyId}`;
        const spotifyWebUrl = `https://open.spotify.com/track/${spotifyId}`;
        
        // Check if Spotify app is installed
        const canOpenSpotify = await Linking.canOpenURL(spotifyUri);
        
        if (canOpenSpotify) {
          await Linking.openURL(spotifyUri);
        } else {
          // Fall back to web URL
          await Linking.openURL(spotifyWebUrl);
        }
      } else {
        // If no Spotify ID, try searching by track name and artist
        const searchQuery = encodeURIComponent(`${track.title} ${track.artist}`);
        const searchUrl = `https://open.spotify.com/search/${searchQuery}`;
        await Linking.openURL(searchUrl);
      }
    } catch (error) {
      console.error('Error opening Spotify:', error);
      Alert.alert(
        'Unable to open Spotify',
        'There was an error opening this track in Spotify.',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteSetlist = async (setlistId, setlistName) => {
    Alert.alert(
      'Delete Set',
      `Are you sure you want to delete "${setlistName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteSetlist(setlistId);
              console.log('[SetsPage] Setlist deleted:', setlistId);
              
              // Remove from local state
              setSetlists(prev => prev.filter(s => s.id !== setlistId));
              
              // Clean up expanded and tracks state
              setExpandedSetlists(prev => {
                const newState = { ...prev };
                delete newState[setlistId];
                return newState;
              });
              setSetlistTracks(prev => {
                const newState = { ...prev };
                delete newState[setlistId];
                return newState;
              });
              
              // Clean up animation value
              delete animatedValues.current[setlistId];
              
              Alert.alert('Success', 'Set deleted successfully');
            } catch (error) {
              console.error('[SetsPage] Error deleting setlist:', error);
              Alert.alert('Error', 'Failed to delete set. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderTrack = (track, index, setlistId, isGlobal) => (
    <TrackItem
      key={track.id}
      track={track}
      index={index}
      onPress={() => openSpotify(track)}
      showScore={true}
      setlistId={setlistId}
      isGlobalSet={isGlobal}
    />
  );

  const renderSetlist = (setlist) => {
    const isExpanded = expandedSetlists[setlist.id];
    const tracks = setlistTracks[setlist.id] || [];
    
    // Initialize animated value for this setlist if it doesn't exist
    if (!animatedValues.current[setlist.id]) {
      animatedValues.current[setlist.id] = new Animated.Value(0);
    }
    
    const animatedValue = animatedValues.current[setlist.id];
    
    // Interpolate the animated value to create color transition
    const backgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.background.secondary, '#FFEBEE'] // White to light red
    });
    
    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.background.secondary, '#FF5252'] // White to red
    });

    const handlePressIn = () => {
      // Start vibration
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate to red
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    };

    const handlePressOut = () => {
      // Animate back to normal
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const handleLongPress = () => {
      // Only allow deletion of personal sets
      if (!setlist.isGlobal) {
        // Heavy vibration for delete confirmation
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        deleteSetlist(setlist.id, setlist.name);
      }
      
      // Reset animation
      animatedValue.setValue(0);
    };

    return (
      <Animated.View 
        key={setlist.id} 
        style={[
          styles.setlistContainer,
          {
            backgroundColor,
            borderWidth: 2,
            borderColor,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.setlistHeader}
          onPress={() => toggleSetlist(setlist.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          activeOpacity={1}
          delayLongPress={500}
        >
          <View style={styles.setlistHeaderLeft}>
            <View style={styles.setlistTitleRow}>
              <Text style={styles.setlistName}>{setlist.name}</Text>
              {setlist.isGlobal && (
                <View style={styles.globalBadge}>
                  <Ionicons name="globe-outline" size={14} color={Colors.text.inverse} />
                  <Text style={styles.globalBadgeText}>Global</Text>
                </View>
              )}
            </View>
            <Text style={styles.setlistMeta}>
              {setlist.trackCount || 0} tracks • {formatDate(setlist.createdAt)}
              {setlist.isGlobal && setlist.numberOfUsers > 1 && (
                <Text style={styles.userCount}> • {setlist.numberOfUsers} contributors</Text>
              )}
            </Text>
            {setlist.venue && (
              <Text style={styles.setlistVenue}>📍 {setlist.venue}</Text>
            )}
            {setlist.isGlobal && !setlist.isActive && (
              <Text style={styles.inactiveText}>Set ended</Text>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={Colors.text.secondary}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.tracksList}>
            {tracks.length > 0 ? (
              tracks.map((track, index) => renderTrack(track, index, setlist.id, setlist.isGlobal))
            ) : (
              <Text style={styles.noTracksText}>No tracks in this setlist</Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.teal} />
          <Text style={styles.loadingText}>Loading setlists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Sets</Text>
          <TouchableOpacity onPress={logout} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSetlists} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {setlists.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              No setlists yet. Start recording to create your first setlist!
            </Text>
          </View>
        ) : (
          <View style={styles.setlistsContainer}>
            {setlists.map(setlist => renderSetlist(setlist))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    color: Colors.primary.teal,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.accent.orange,
    borderRadius: 20,
  },
  retryText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: Colors.background.secondary,
    padding: 30,
    borderRadius: 16,
    elevation: 3,
    shadowColor: Colors.primary.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.primary.tealLight,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  signOutButton: {
    padding: 6,
  },
  setlistsContainer: {
    width: '100%',
  },
  setlistContainer: {
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: Colors.primary.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  setlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  setlistHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  setlistName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  setlistMeta: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 3,
  },
  setlistVenue: {
    fontSize: 14,
    color: Colors.primary.teal,
    marginTop: 3,
  },
  tracksList: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
  },
  noTracksText: {
    textAlign: 'center',
    padding: 20,
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  setlistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  globalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.orange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  globalBadgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  userCount: {
    color: Colors.accent.orange,
    fontWeight: '600',
  },
  inactiveText: {
    color: Colors.text.tertiary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 3,
  },
});

export default SetsPage;