import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirebaseService {
  constructor() {
    this.db = db;
  }

  // ========== SETLIST OPERATIONS ==========

  /**
   * Create a new setlist
   * @param {Object} setlistData - Setlist data
   * @returns {Promise<string>} - The ID of the created setlist
   */
  async createSetlist(setlistData) {
    try {
      const setlistRef = await addDoc(collection(this.db, 'setlists'), {
        ...setlistData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        trackCount: 0,
      });
      console.log('[FirebaseService] Setlist created with ID:', setlistRef.id);
      return setlistRef.id;
    } catch (error) {
      console.error('[FirebaseService] Error creating setlist:', error);
      throw error;
    }
  }

  /**
   * Get a single setlist by ID
   * @param {string} setlistId - The ID of the setlist
   * @returns {Promise<Object>} - The setlist data
   */
  async getSetlist(setlistId) {
    try {
      const setlistDoc = await getDoc(doc(this.db, 'setlists', setlistId));
      if (setlistDoc.exists()) {
        return { id: setlistDoc.id, ...setlistDoc.data() };
      } else {
        throw new Error('Setlist not found');
      }
    } catch (error) {
      console.error('[FirebaseService] Error getting setlist:', error);
      throw error;
    }
  }

  /**
   * Get all setlists for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of setlists
   */
  async getUserSetlists(userId) {
    try {
      const q = query(
        collection(this.db, 'setlists'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const setlists = [];
      querySnapshot.forEach((doc) => {
        setlists.push({ id: doc.id, ...doc.data() });
      });
      return setlists;
    } catch (error) {
      console.error('[FirebaseService] Error getting user setlists:', error);
      throw error;
    }
  }

  /**
   * Get all setlists (for demo purposes)
   * @returns {Promise<Array>} - Array of all setlists
   */
  async getAllSetlists() {
    try {
      // Get personal setlists
      const personalQuery = query(
        collection(this.db, 'setlists'),
        orderBy('createdAt', 'desc')
      );
      const personalSnapshot = await getDocs(personalQuery);
      const personalSetlists = [];
      personalSnapshot.forEach((doc) => {
        personalSetlists.push({ 
          id: doc.id, 
          ...doc.data(),
          isGlobal: false // Ensure personal sets are marked as not global
        });
      });

      // Get global setlists
      const globalQuery = query(
        collection(this.db, 'globalSets'),
        orderBy('createdAt', 'desc')
      );
      const globalSnapshot = await getDocs(globalQuery);
      const globalSetlists = [];
      globalSnapshot.forEach((doc) => {
        globalSetlists.push({ 
          id: doc.id, 
          ...doc.data(),
          isGlobal: true // Mark as global
        });
      });

      // Combine and sort by createdAt
      const allSetlists = [...personalSetlists, ...globalSetlists];
      allSetlists.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      return allSetlists;
    } catch (error) {
      console.error('[FirebaseService] Error getting all setlists:', error);
      throw error;
    }
  }

  /**
   * Update a setlist
   * @param {string} setlistId - The ID of the setlist
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateSetlist(setlistId, updates) {
    try {
      await updateDoc(doc(this.db, 'setlists', setlistId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('[FirebaseService] Setlist updated:', setlistId);
    } catch (error) {
      console.error('[FirebaseService] Error updating setlist:', error);
      throw error;
    }
  }

  /**
   * Delete a setlist and all its tracks
   * @param {string} setlistId - The ID of the setlist
   * @returns {Promise<void>}
   */
  async deleteSetlist(setlistId) {
    try {
      // First delete all tracks in the setlist
      const tracks = await this.getSetlistTracks(setlistId);
      for (const track of tracks) {
        await this.deleteTrack(setlistId, track.id);
      }
      
      // Then delete the setlist
      await deleteDoc(doc(this.db, 'setlists', setlistId));
      console.log('[FirebaseService] Setlist deleted:', setlistId);
    } catch (error) {
      console.error('[FirebaseService] Error deleting setlist:', error);
      throw error;
    }
  }

  // ========== TRACK OPERATIONS ==========

  /**
   * Add a track to a setlist
   * @param {string} setlistId - The ID of the setlist
   * @param {Object} trackData - Track data
   * @returns {Promise<string>} - The ID of the created track
   */
  async addTrack(setlistId, trackData) {
    try {
      // Add the track to the subcollection
      const trackRef = await addDoc(
        collection(this.db, 'setlists', setlistId, 'tracks'),
        {
          ...trackData,
          createdAt: serverTimestamp(),
          setlistId: setlistId,
        }
      );
      
      // Update the track count in the setlist
      const setlistRef = doc(this.db, 'setlists', setlistId);
      const setlistDoc = await getDoc(setlistRef);
      const currentCount = setlistDoc.data()?.trackCount || 0;
      await updateDoc(setlistRef, {
        trackCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
      
      console.log('[FirebaseService] Track added with ID:', trackRef.id);
      return trackRef.id;
    } catch (error) {
      console.error('[FirebaseService] Error adding track:', error);
      throw error;
    }
  }

  /**
   * Get all tracks for a setlist
   * @param {string} setlistId - The ID of the setlist
   * @returns {Promise<Array>} - Array of tracks
   */
  async getSetlistTracks(setlistId) {
    try {
      const q = query(
        collection(this.db, 'setlists', setlistId, 'tracks'),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const tracks = [];
      querySnapshot.forEach((doc) => {
        tracks.push({ id: doc.id, ...doc.data() });
      });
      return tracks;
    } catch (error) {
      console.error('[FirebaseService] Error getting tracks:', error);
      throw error;
    }
  }

  /**
   * Get a single track
   * @param {string} setlistId - The ID of the setlist
   * @param {string} trackId - The ID of the track
   * @returns {Promise<Object>} - The track data
   */
  async getTrack(setlistId, trackId) {
    try {
      const trackDoc = await getDoc(
        doc(this.db, 'setlists', setlistId, 'tracks', trackId)
      );
      if (trackDoc.exists()) {
        return { id: trackDoc.id, ...trackDoc.data() };
      } else {
        throw new Error('Track not found');
      }
    } catch (error) {
      console.error('[FirebaseService] Error getting track:', error);
      throw error;
    }
  }

  /**
   * Update a track
   * @param {string} setlistId - The ID of the setlist
   * @param {string} trackId - The ID of the track
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateTrack(setlistId, trackId, updates) {
    try {
      await updateDoc(
        doc(this.db, 'setlists', setlistId, 'tracks', trackId),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        }
      );
      
      // Update the setlist's updatedAt timestamp
      await updateDoc(doc(this.db, 'setlists', setlistId), {
        updatedAt: serverTimestamp(),
      });
      
      console.log('[FirebaseService] Track updated:', trackId);
    } catch (error) {
      console.error('[FirebaseService] Error updating track:', error);
      throw error;
    }
  }

  /**
   * Delete a track from a setlist
   * @param {string} setlistId - The ID of the setlist
   * @param {string} trackId - The ID of the track
   * @returns {Promise<void>}
   */
  async deleteTrack(setlistId, trackId) {
    try {
      await deleteDoc(
        doc(this.db, 'setlists', setlistId, 'tracks', trackId)
      );
      
      // Update the track count in the setlist
      const setlistRef = doc(this.db, 'setlists', setlistId);
      const setlistDoc = await getDoc(setlistRef);
      const currentCount = setlistDoc.data()?.trackCount || 0;
      await updateDoc(setlistRef, {
        trackCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
      
      console.log('[FirebaseService] Track deleted:', trackId);
    } catch (error) {
      console.error('[FirebaseService] Error deleting track:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if a track already exists in a setlist (duplicate detection)
   * @param {string} setlistId - The ID of the setlist
   * @param {string} title - Track title
   * @param {string} artist - Track artist
   * @returns {Promise<boolean>} - True if duplicate exists
   */
  async checkDuplicateTrack(setlistId, title, artist) {
    try {
      const tracks = await this.getSetlistTracks(setlistId);
      return tracks.some(track => 
        track.title?.toLowerCase() === title?.toLowerCase() && 
        track.artist?.toLowerCase() === artist?.toLowerCase()
      );
    } catch (error) {
      console.error('[FirebaseService] Error checking duplicate:', error);
      throw error;
    }
  }

  /**
   * Create a track object from ACRCloud match data
   * @param {Object} matchData - The match data from ACRCloud
   * @param {string} userId - The user ID
   * @returns {Object} - Track object ready for Firebase
   */
  createTrackFromMatch(matchData, userId) {
    const music = matchData.metadata.music?.[0];
    if (!music) {
      throw new Error('No music data in match');
    }

    return {
      title: music.title || 'Unknown',
      artist: music.artists?.map(a => a.name).join(', ') || 'Unknown',
      album: music.album?.name || null,
      releaseDate: music.release_date || null,
      score: music.score || 0,
      userId: userId,
      bucketTime: Timestamp.now(),
      likes: 0,
      dislikes: 0,
      userVotes: {},
      acrCloudData: music, // Store the full ACRCloud data
      identifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Batch add multiple tracks to a setlist
   * @param {string} setlistId - The ID of the setlist
   * @param {Array} tracks - Array of track data
   * @returns {Promise<Array>} - Array of created track IDs
   */
  async batchAddTracks(setlistId, tracks) {
    try {
      const trackIds = [];
      for (const track of tracks) {
        const trackId = await this.addTrack(setlistId, track);
        trackIds.push(trackId);
      }
      return trackIds;
    } catch (error) {
      console.error('[FirebaseService] Error batch adding tracks:', error);
      throw error;
    }
  }

  // ========== GLOBAL SETS OPERATIONS ==========

  /**
   * Create a global setlist
   * @param {Object} setlistData - Setlist data including coordinates
   * @returns {Promise<string>} - The ID of the created global setlist
   */
  async createGlobalSetlist(setlistData) {
    try {
      const globalSetRef = await addDoc(collection(this.db, 'globalSets'), {
        ...setlistData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        trackCount: 0,
        isActive: true,
        numberOfUsers: 1,
        isGlobal: true,
      });
      console.log('[FirebaseService] Global setlist created with ID:', globalSetRef.id);
      return globalSetRef.id;
    } catch (error) {
      console.error('[FirebaseService] Error creating global setlist:', error);
      throw error;
    }
  }

  /**
   * Get nearby active global sets within radius
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @param {number} radiusInMeters - Search radius (default 500m)
   * @returns {Promise<Array>} - Array of nearby active global sets
   */
  async getNearbyGlobalSets(latitude, longitude, radiusInMeters = 500) {
    try {
      // Get all active global sets
      const q = query(
        collection(this.db, 'globalSets'),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const nearbySets = [];
      
      querySnapshot.forEach((doc) => {
        const setData = { id: doc.id, ...doc.data() };
        
        // Calculate distance using Haversine formula
        if (setData.coordinates) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            setData.coordinates.latitude,
            setData.coordinates.longitude
          );
          
          if (distance <= radiusInMeters) {
            nearbySets.push({
              ...setData,
              distance: Math.round(distance), // Include distance for display
            });
          }
        }
      });
      
      // Sort by distance
      nearbySets.sort((a, b) => a.distance - b.distance);
      
      return nearbySets;
    } catch (error) {
      console.error('[FirebaseService] Error getting nearby global sets:', error);
      throw error;
    }
  }

  /**
   * Join a global set (increment user count)
   * @param {string} globalSetId - The ID of the global set
   * @returns {Promise<void>}
   */
  async joinGlobalSet(globalSetId) {
    try {
      const setRef = doc(this.db, 'globalSets', globalSetId);
      const setDoc = await getDoc(setRef);
      
      if (setDoc.exists()) {
        const currentUsers = setDoc.data().numberOfUsers || 1;
        await updateDoc(setRef, {
          numberOfUsers: currentUsers + 1,
          updatedAt: serverTimestamp(),
        });
        console.log('[FirebaseService] Joined global set:', globalSetId);
      }
    } catch (error) {
      console.error('[FirebaseService] Error joining global set:', error);
      throw error;
    }
  }

  /**
   * Leave a global set (decrement user count)
   * @param {string} globalSetId - The ID of the global set
   * @returns {Promise<void>}
   */
  async leaveGlobalSet(globalSetId) {
    try {
      const setRef = doc(this.db, 'globalSets', globalSetId);
      const setDoc = await getDoc(setRef);
      
      if (setDoc.exists()) {
        const currentUsers = setDoc.data().numberOfUsers || 1;
        await updateDoc(setRef, {
          numberOfUsers: Math.max(1, currentUsers - 1),
          updatedAt: serverTimestamp(),
        });
        console.log('[FirebaseService] Left global set:', globalSetId);
      }
    } catch (error) {
      console.error('[FirebaseService] Error leaving global set:', error);
      throw error;
    }
  }

  /**
   * Deactivate a global set
   * @param {string} globalSetId - The ID of the global set
   * @returns {Promise<void>}
   */
  async deactivateGlobalSet(globalSetId) {
    try {
      await updateDoc(doc(this.db, 'globalSets', globalSetId), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      console.log('[FirebaseService] Global set deactivated:', globalSetId);
    } catch (error) {
      console.error('[FirebaseService] Error deactivating global set:', error);
      throw error;
    }
  }

  /**
   * Get a global setlist by ID
   * @param {string} globalSetId - The ID of the global setlist
   * @returns {Promise<Object>} - The global setlist data
   */
  async getGlobalSetlist(globalSetId) {
    try {
      const setDoc = await getDoc(doc(this.db, 'globalSets', globalSetId));
      if (setDoc.exists()) {
        return { id: setDoc.id, ...setDoc.data() };
      } else {
        throw new Error('Global setlist not found');
      }
    } catch (error) {
      console.error('[FirebaseService] Error getting global setlist:', error);
      throw error;
    }
  }

  /**
   * Add a track to a global setlist with deduplication
   * @param {string} globalSetId - The ID of the global setlist
   * @param {Object} trackData - Track data
   * @returns {Promise<string>} - The ID of the created/updated track
   */
  async addTrackToGlobalSet(globalSetId, trackData) {
    try {
      // Check for existing track
      const existingTracks = await this.getGlobalSetTracks(globalSetId);
      const existingTrack = existingTracks.find(track => 
        track.title?.toLowerCase() === trackData.title?.toLowerCase() && 
        track.artist?.toLowerCase() === trackData.artist?.toLowerCase()
      );

      if (existingTrack) {
        // Update if new score is higher
        if (trackData.score > existingTrack.score) {
          await updateDoc(
            doc(this.db, 'globalSets', globalSetId, 'tracks', existingTrack.id),
            {
              score: trackData.score,
              acrCloudData: trackData.acrCloudData,
              updatedAt: serverTimestamp(),
            }
          );
          console.log('[FirebaseService] Updated track with higher score in global set');
          return existingTrack.id;
        } else {
          console.log('[FirebaseService] Track exists with equal/higher score, skipping');
          return existingTrack.id;
        }
      } else {
        // Add new track
        const trackRef = await addDoc(
          collection(this.db, 'globalSets', globalSetId, 'tracks'),
          {
            ...trackData,
            createdAt: serverTimestamp(),
            globalSetId: globalSetId,
          }
        );
        
        // Update track count
        const setRef = doc(this.db, 'globalSets', globalSetId);
        const setDoc = await getDoc(setRef);
        const currentCount = setDoc.data()?.trackCount || 0;
        await updateDoc(setRef, {
          trackCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
        
        console.log('[FirebaseService] Track added to global set:', trackRef.id);
        return trackRef.id;
      }
    } catch (error) {
      console.error('[FirebaseService] Error adding track to global set:', error);
      throw error;
    }
  }

  /**
   * Get tracks from a global setlist
   * @param {string} globalSetId - The ID of the global setlist
   * @returns {Promise<Array>} - Array of tracks
   */
  async getGlobalSetTracks(globalSetId) {
    try {
      const q = query(
        collection(this.db, 'globalSets', globalSetId, 'tracks'),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const tracks = [];
      querySnapshot.forEach((doc) => {
        tracks.push({ id: doc.id, ...doc.data() });
      });
      return tracks;
    } catch (error) {
      console.error('[FirebaseService] Error getting global set tracks:', error);
      throw error;
    }
  }

  /**
   * Update track vote (like/dislike)
   * @param {string} setlistId - The ID of the setlist
   * @param {string} trackId - The ID of the track
   * @param {string} userId - The ID of the user
   * @param {string|null} voteType - 'like', 'dislike', or null to remove vote
   * @param {number} likes - New like count
   * @param {number} dislikes - New dislike count
   * @param {boolean} isGlobalSet - Whether this is a global set
   * @returns {Promise<void>}
   */
  async updateTrackVote(setlistId, trackId, userId, voteType, likes, dislikes, isGlobalSet = false) {
    try {
      const collection = isGlobalSet ? 'globalSets' : 'setlists';
      const trackRef = doc(this.db, collection, setlistId, 'tracks', trackId);
      
      const updates = {
        likes: likes,
        dislikes: dislikes,
        [`userVotes.${userId}`]: voteType,
        updatedAt: serverTimestamp(),
      };
      
      if (voteType === null) {
        // Remove the user's vote
        delete updates[`userVotes.${userId}`];
        updates[`userVotes.${userId}`] = null;
      }
      
      await updateDoc(trackRef, updates);
      
      console.log('[FirebaseService] Track vote updated:', trackId);
    } catch (error) {
      console.error('[FirebaseService] Error updating track vote:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} - Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

// Export a singleton instance
export default new FirebaseService();