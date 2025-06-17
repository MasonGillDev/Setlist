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
      const q = query(
        collection(this.db, 'setlists'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const setlists = [];
      querySnapshot.forEach((doc) => {
        setlists.push({ id: doc.id, ...doc.data() });
      });
      return setlists;
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
}

// Export a singleton instance
export default new FirebaseService();