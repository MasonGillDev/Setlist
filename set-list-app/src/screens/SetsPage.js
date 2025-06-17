import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FirebaseService from '../services/FirebaseService';

const SetsPage = () => {
  const [setlists, setSetlists] = useState([]);
  const [expandedSetlists, setExpandedSetlists] = useState({});
  const [setlistTracks, setSetlistTracks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Temporary user ID - same as in useAudioIdentification
  const userId = 'user_' + Date.now();

  useEffect(() => {
    loadSetlists();
  }, []);

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
        const tracks = await FirebaseService.getSetlistTracks(setlistId);
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

  const renderTrack = (track, index) => (
    <View key={track.id} style={styles.trackItem}>
      <View style={styles.trackNumber}>
        <Text style={styles.trackNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.artist}</Text>
        {track.album && (
          <Text style={styles.trackAlbum}>{track.album}</Text>
        )}
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.trackScore}>{track.score}%</Text>
      </View>
    </View>
  );

  const renderSetlist = (setlist) => {
    const isExpanded = expandedSetlists[setlist.id];
    const tracks = setlistTracks[setlist.id] || [];

    return (
      <View key={setlist.id} style={styles.setlistContainer}>
        <TouchableOpacity 
          style={styles.setlistHeader}
          onPress={() => toggleSetlist(setlist.id)}
          activeOpacity={0.7}
        >
          <View style={styles.setlistHeaderLeft}>
            <Text style={styles.setlistName}>{setlist.name}</Text>
            <Text style={styles.setlistMeta}>
              {setlist.trackCount || 0} tracks • {formatDate(setlist.createdAt)}
            </Text>
            {setlist.venue && (
              <Text style={styles.setlistVenue}>📍 {setlist.venue}</Text>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.tracksList}>
            {tracks.length > 0 ? (
              tracks.map((track, index) => renderTrack(track, index))
            ) : (
              <Text style={styles.noTracksText}>No tracks in this setlist</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading setlists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>My Sets</Text>
        
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
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
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
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  setlistsContainer: {
    width: '100%',
  },
  setlistContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#333',
    marginBottom: 5,
  },
  setlistMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  setlistVenue: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 3,
  },
  tracksList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trackNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  trackInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  trackMeta: {
    alignItems: 'flex-end',
  },
  trackScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  noTracksText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontSize: 14,
  },
});

export default SetsPage;