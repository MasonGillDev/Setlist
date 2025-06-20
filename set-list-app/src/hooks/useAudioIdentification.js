import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { ACRCloudConfig } from "../config/acrcloud";
import { Setlist } from "../models/setlist";
import { Track } from "../models/track";
import ACRCloudService from "../services/ACRCloudService";
import FirebaseService from "../services/FirebaseService";

const useAudioIdentification = () => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const [error, setError] = useState(null);
  const [currentSetlistId, setCurrentSetlistId] = useState(null);
  const [isGlobalSet, setIsGlobalSet] = useState(false);
  const [numberOfUsers, setNumberOfUsers] = useState(1);
  const [debugInfo, setDebugInfo] = useState({});

  const acrService = useRef(new ACRCloudService(ACRCloudConfig)).current;
  const recordingInterval = useRef(null);
  const userId = useRef("user_" + Date.now()).current; // Temporary user ID
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [recording]);

  const startRecording = async (setInfo = {}) => {
    try {
      console.log("[useAudioIdentification] Starting recording process...");
      console.log("[useAudioIdentification] Set info received:", JSON.stringify(setInfo, null, 2));
      setError(null);
      setMatchResults([]); // Clear previous matches when starting new session

      // Create a new setlist for this recording session
      let setlistId;
      // Determine if this should be a global set
      const globalSet = setInfo.isGlobal || !!setInfo.coordinates;
      setIsGlobalSet(globalSet);
      
      try {
        // Verify Firebase is accessible
        if (!db) {
          console.error("[useAudioIdentification] Firebase database not initialized");
          setError("Database connection error. Please restart the app.");
          return;
        }
        
        if (setInfo.globalSetId) {
          // Joining an existing global set
          setlistId = setInfo.globalSetId;
          console.log(
            "[useAudioIdentification] Joining global setlist with ID:",
            setlistId
          );
          setIsGlobalSet(true); // Ensure it's marked as global
        } else if (globalSet) {
          // Creating a new global set (has coordinates)
          const setlist = new Setlist({
            name:
              setInfo.name ||
              `Recording Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            userId: userId,
            venue: setInfo.venue || null,
            date: new Date(),
            description: "Live music identification session",
            coordinates: setInfo.coordinates,
            isGlobal: true,
            isActive: true,
          });

          setlistId = await FirebaseService.createGlobalSetlist(setlist.toFirestore());
          console.log(
            "[useAudioIdentification] Created global setlist with ID:",
            setlistId
          );
        } else {
          // Creating a personal set (no coordinates)
          const setlist = new Setlist({
            name:
              setInfo.name ||
              `Recording Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            userId: userId,
            venue: setInfo.venue || null,
            date: new Date(),
            description: "Live music identification session",
          });

          setlistId = await FirebaseService.createSetlist(setlist.toFirestore());
          console.log(
            "[useAudioIdentification] Created personal setlist with ID:",
            setlistId
          );
        }
        
        setCurrentSetlistId(setlistId);

        // Set up real-time listener for global sets
        if (globalSet && setlistId) {
          const setRef = doc(db, 'globalSets', setlistId);
          unsubscribeRef.current = onSnapshot(setRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setNumberOfUsers(data.numberOfUsers || 1);
              console.log('[useAudioIdentification] Number of users updated:', data.numberOfUsers);
            }
          });
        }
      } catch (err) {
        console.error(
          "[useAudioIdentification] Failed to create/join setlist:",
          err
        );
        setError("Failed to create/join setlist: " + err.message);
        return;
      }

      // Ensure any existing recording is properly stopped
      if (recording) {
        console.log(
          "[useAudioIdentification] Cleaning up existing recording..."
        );
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          console.log("[useAudioIdentification] Cleanup error:", err.message);
        }
        setRecording(null);
      }

      // Request permissions
      console.log(
        "[useAudioIdentification] Requesting microphone permissions..."
      );
      const permission = await Audio.requestPermissionsAsync();
      console.log(
        "[useAudioIdentification] Permission response:",
        JSON.stringify(permission, null, 2)
      );

      if (permission.status !== "granted") {
        console.error("[useAudioIdentification] Microphone permission denied");
        setError("Permission to access microphone denied. Please enable microphone access in your device settings.");
        return;
      }

      // Configure audio for optimal quality
      console.log("[useAudioIdentification] Configuring audio mode...");
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false, // Don't lower other app's audio
          playThroughEarpieceAndroid: false,
        });
        console.log("[useAudioIdentification] Audio mode configured successfully");
      } catch (audioModeError) {
        console.error("[useAudioIdentification] Error setting audio mode:", audioModeError);
        // Continue anyway as this might not be critical
      }

      // Start recording with high quality settings
      console.log("[useAudioIdentification] Creating audio recording...");
      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC, // Standard AAC encoder
          sampleRate: 44100, // ACRCloud recommended sample rate
          numberOfChannels: 2, // Stereo for better recognition
          bitRate: 256000, // High bitrate (above 128 kbps minimum)
        },
        ios: {
          extension: ".m4a",
          audioQuality: Audio.IOSAudioQuality.MAX, // Maximum quality
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          sampleRate: 44100, // ACRCloud recommended sample rate
          numberOfChannels: 2, // Stereo
          bitRate: 256000, // High bitrate
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 256000,
        },
      };

      let newRecording;
      try {
        console.log("[useAudioIdentification] About to create recording with options:", JSON.stringify(recordingOptions, null, 2));
        const recordingResult = await Audio.Recording.createAsync(recordingOptions);
        newRecording = recordingResult.recording;
        console.log("[useAudioIdentification] Recording created successfully");
        console.log("[useAudioIdentification] Recording object exists:", !!newRecording);
      } catch (recordingError) {
        console.error("[useAudioIdentification] Failed to create recording:", recordingError);
        console.error("[useAudioIdentification] Recording error details:", {
          name: recordingError.name,
          message: recordingError.message,
          code: recordingError.code,
          stack: recordingError.stack
        });
        
        // Clean up setlist if recording fails
        if (setlistId && !globalSet) {
          try {
            await FirebaseService.deleteSetlist(setlistId);
            console.log("[useAudioIdentification] Cleaned up failed setlist");
          } catch (cleanupErr) {
            console.error("[useAudioIdentification] Failed to cleanup setlist:", cleanupErr);
          }
        }
        
        setError(`Failed to start recording: ${recordingError.message}`);
        setCurrentSetlistId(null);
        return;
      }
      
      // Get initial status
      const initialStatus = await newRecording.getStatusAsync();
      console.log("[useAudioIdentification] Initial recording status:", JSON.stringify(initialStatus, null, 2));
      
      if (!initialStatus.isRecording) {
        console.error("[useAudioIdentification] Recording failed to start properly");
        setError("Recording created but not active. Please check microphone permissions and try again.");
        // Clean up the failed recording
        try {
          await newRecording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error("[useAudioIdentification] Cleanup error:", cleanupError);
        }
        
        // Clean up setlist
        if (setlistId && !globalSet) {
          try {
            await FirebaseService.deleteSetlist(setlistId);
          } catch (cleanupErr) {
            console.error("[useAudioIdentification] Failed to cleanup setlist:", cleanupErr);
          }
        }
        
        setCurrentSetlistId(null);
        return;
      }
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start chunked recording and identification
      console.log(
        "[useAudioIdentification] Starting chunked identification..."
      );
      startChunkedIdentification(newRecording, setlistId, globalSet);
      
      console.log("[useAudioIdentification] Recording process fully initiated");
      console.log("[useAudioIdentification] Current state - isRecording:", true);
      console.log("[useAudioIdentification] Current state - currentSetlistId:", setlistId);
    } catch (err) {
      console.error("[useAudioIdentification] Failed to start recording:", err);
      console.error("[useAudioIdentification] Error stack:", err.stack);
      console.error("[useAudioIdentification] Error details:", {
        name: err.name,
        message: err.message,
        code: err.code,
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to start recording: ";
      if (err.message.includes("permission")) {
        errorMessage += "Microphone permission denied. Please check your settings.";
      } else if (err.message.includes("Audio")) {
        errorMessage += "Audio system error. Please restart the app and try again.";
      } else if (err.message.includes("Firebase") || err.message.includes("firestore")) {
        errorMessage += "Database connection error. Please check your internet connection.";
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setIsRecording(false);
    }
  };

  const startChunkedIdentification = (initialRecording, setlistId, isGlobalSet) => {
    let currentRecording = initialRecording;
    let shouldContinue = true;
    let chunkNumber = 0;

    console.log(
      "[useAudioIdentification] Starting continuous recording and identification..."
    );
    console.log("[useAudioIdentification] Initial recording object:", initialRecording);
    console.log("[useAudioIdentification] Setlist ID:", setlistId);
    console.log("[useAudioIdentification] Is global set:", isGlobalSet);

    const recordAndIdentify = async () => {
      while (shouldContinue && recordingInterval.current) {
        chunkNumber++;
        console.log(
          `[useAudioIdentification] Starting chunk #${chunkNumber}...`
        );

        try {
          // Wait 10 seconds to record
          console.log("[useAudioIdentification] Recording for 10 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 10000));

          // Check if we should still continue
          if (!shouldContinue || !recordingInterval.current) {
            console.log(
              "[useAudioIdentification] Stopping continuous recording..."
            );
            break;
          }

          // Stop current recording
          console.log("[useAudioIdentification] Stopping current recording...");
          await currentRecording.stopAndUnloadAsync();
          const uri = currentRecording.getURI();
          console.log("[useAudioIdentification] Recording URI:", uri);

          // Process the recording
          if (uri) {
            console.log("[useAudioIdentification] Identifying audio...");
            setIsIdentifying(true);

            // Don't await this - let it run in background
            identifyAudio(uri, setlistId, isGlobalSet)
              .then(() => {
                console.log(
                  "[useAudioIdentification] Identification completed"
                );
              })
              .catch((err) => {
                console.error(
                  "[useAudioIdentification] Identification error:",
                  err
                );
              });
          }

          // Wait 20 seconds before starting new recording
          console.log(
            "[useAudioIdentification] Waiting 20 seconds before next recording..."
          );
          await new Promise((resolve) => setTimeout(resolve, 20000));

          // Check again if we should continue after the wait
          if (!shouldContinue || !recordingInterval.current) {
            console.log(
              "[useAudioIdentification] Stopping continuous recording..."
            );
            break;
          }

          // Start new recording after the wait
          console.log(
            "[useAudioIdentification] Starting new recording after wait..."
          );
          const recordingOptions = {
            android: {
              extension: ".m4a",
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 256000,
            },
            ios: {
              extension: ".m4a",
              audioQuality: Audio.IOSAudioQuality.MAX,
              outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 256000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: "audio/webm",
              bitsPerSecond: 256000,
            },
          };

          const { recording: newRecording } = await Audio.Recording.createAsync(
            recordingOptions
          );
          setRecording(newRecording);
          currentRecording = newRecording;
          console.log("[useAudioIdentification] New recording started");

          console.log(
            `[useAudioIdentification] Chunk #${chunkNumber} processed, continuing...`
          );
        } catch (err) {
          console.error(
            "[useAudioIdentification] Error in recording loop:",
            err
          );
          setError("Error in recording: " + err.message);
          shouldContinue = false;
        }
      }

      console.log("[useAudioIdentification] Recording loop ended");
    };

    // Store a reference to stop the loop
    recordingInterval.current = {
      stop: () => {
        shouldContinue = false;
      },
    };

    // Start the continuous recording
    recordAndIdentify();
  };

  const identifyAudio = async (uri, setlistId, isGlobalSet = false) => {
    try {
      console.log(
        "[useAudioIdentification] Starting audio identification for URI:",
        uri
      );

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("[useAudioIdentification] File info:", fileInfo);

      // Create a file object for FormData
      const audioFile = {
        uri: uri,
        type: "audio/mp4",
        name: "recording.m4a",
      };

      // Send file directly to ACRCloud
      console.log(
        "[useAudioIdentification] Sending to ACRCloud for identification..."
      );
      const result = await acrService.identifyFile(audioFile, fileInfo.size);
      console.log(
        "[useAudioIdentification] ACRCloud response:",
        JSON.stringify(result, null, 2)
      );

      if (result.status && result.status.msg === "Success" && result.metadata) {
        console.log(
          "[useAudioIdentification] Match found! Metadata:",
          JSON.stringify(result.metadata, null, 2)
        );

        const music = result.metadata.music?.[0];
        if (music && music.score >= 40) {
          // Use functional update to check for duplicates with current state
          setMatchResults((prev) => {
            // Check if this song is already in the list
            const existingIndex = prev.findIndex((match) => {
              const existingMusic = match.metadata.music?.[0];
              return (
                existingMusic &&
                existingMusic.title === music.title &&
                existingMusic.artists?.[0]?.name === music.artists?.[0]?.name
              );
            });

            if (existingIndex === -1) {
              // Add to matches list with timestamp
              const newMatch = {
                ...result,
                timestamp: new Date().toISOString(),
                id: Date.now(), // Simple ID for key prop
              };
              console.log(
                "[useAudioIdentification] New song added to list, continuing to record..."
              );

              // Add track to Firebase setlist and get the ID
              if (setlistId) {
                console.log(
                  "[useAudioIdentification] Adding track to Firebase setlist:",
                  setlistId
                );
                // Add track to Firebase and update with the returned ID
                addTrackToFirebase(result, setlistId, isGlobalSet).then((trackId) => {
                  if (trackId) {
                    // Update the match result with the Firebase track ID
                    setMatchResults((currentResults) => {
                      return currentResults.map((match) => 
                        match.id === newMatch.id 
                          ? { ...match, firebaseTrackId: trackId }
                          : match
                      );
                    });
                  }
                });
              } else {
                console.warn(
                  "[useAudioIdentification] No setlistId available for adding track"
                );
              }

              return [...prev, newMatch];
            } else {
              // Check if new match has higher confidence
              const existingScore =
                prev[existingIndex].metadata.music?.[0]?.score || 0;
              const newScore = music.score || 0;

              if (newScore > existingScore) {
                // Replace with higher confidence match
                const updatedMatches = [...prev];
                updatedMatches[existingIndex] = {
                  ...result,
                  timestamp: new Date().toISOString(),
                  id: prev[existingIndex].id, // Keep same ID for React key
                };
                console.log(
                  `[useAudioIdentification] Updated song with higher confidence: ${existingScore}% -> ${newScore}%`
                );

                // Update track in Firebase with higher confidence
                if (setlistId) {
                  updateTrackInFirebase(
                    result,
                    setlistId,
                    music.title,
                    music.artists?.[0]?.name,
                    isGlobalSet
                  );
                }

                return updatedMatches;
              } else {
                console.log(
                  `[useAudioIdentification] Song already in list with equal/higher confidence (existing: ${existingScore}%, new: ${newScore}%)`
                );
                return prev; // Return unchanged array
              }
            }
          });
        } else if (music && music.score < 40) {
          console.log(
            `[useAudioIdentification] Match found but confidence too low: ${music.score}% (minimum: 40%)`
          );
        }
      } else {
        console.log("[useAudioIdentification] No match found in this chunk");
        console.log("[useAudioIdentification] Status:", result.status);
      }

      setIsIdentifying(false);
    } catch (err) {
      console.error("[useAudioIdentification] Identification error:", err);
      console.error(
        "[useAudioIdentification] Identification error stack:",
        err.stack
      );
      setError("Failed to identify audio: " + err.message);
      setIsIdentifying(false);
    }
  };

  const stopRecording = async () => {
    try {
      console.log("[useAudioIdentification] Stopping recording...");

      if (recordingInterval.current && recordingInterval.current.stop) {
        console.log("[useAudioIdentification] Stopping recording loop...");
        recordingInterval.current.stop();
        recordingInterval.current = null;
      }

      // Give the loop a moment to stop
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (recording) {
        console.log(
          "[useAudioIdentification] Stopping and unloading current recording..."
        );
        try {
          const recordingStatus = await recording.getStatusAsync();
          console.log(
            "[useAudioIdentification] Recording status:",
            recordingStatus
          );

          if (recordingStatus.isRecording) {
            await recording.stopAndUnloadAsync();
          }
        } catch (err) {
          console.log(
            "[useAudioIdentification] Recording cleanup error:",
            err.message
          );
        }
        setRecording(null);
        console.log("[useAudioIdentification] Recording stopped successfully");
      }

      setIsRecording(false);
      setIsIdentifying(false);
      
      // Deactivate global set if it was created by this user
      if (isGlobalSet && currentSetlistId) {
        try {
          await FirebaseService.deactivateGlobalSet(currentSetlistId);
          console.log("[useAudioIdentification] Global set deactivated");
        } catch (err) {
          console.error("[useAudioIdentification] Failed to deactivate global set:", err);
        }
      }
      
      // Clean up real-time listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Reset state
      setIsGlobalSet(false);
      setCurrentSetlistId(null);
      setNumberOfUsers(1);
      setMatchResults([]); // Clear the identified songs
      
      console.log("[useAudioIdentification] Recording process completed");
    } catch (err) {
      console.error("[useAudioIdentification] Failed to stop recording:", err);
      console.error(
        "[useAudioIdentification] Stop recording error stack:",
        err.stack
      );
      setError("Failed to stop recording: " + err.message);
    }
  };

  // Helper function to add track to Firebase
  const addTrackToFirebase = async (matchData, setlistId, isGlobalSet = false) => {
    try {
      console.log("[useAudioIdentification] addTrackToFirebase called with:", {
        setlistId,
        isGlobalSet,
        userId
      });
      
      const track = Track.fromACRCloudMatch(matchData, userId);
      const trackData = track.toFirestore();

      let trackId;
      if (isGlobalSet) {
        console.log("[useAudioIdentification] Adding track to GLOBAL set");
        trackId = await FirebaseService.addTrackToGlobalSet(setlistId, trackData);
      } else {
        console.log("[useAudioIdentification] Adding track to PERSONAL set");
        trackId = await FirebaseService.addTrack(setlistId, trackData);
      }
      
      console.log(
        "[useAudioIdentification] Track added to Firebase with ID:",
        trackId
      );
      
      return trackId;
    } catch (err) {
      console.error(
        "[useAudioIdentification] Failed to add track to Firebase:",
        err
      );
      return null;
    }
  };

  // Helper function to update track in Firebase
  const updateTrackInFirebase = async (matchData, setlistId, title, artist, isGlobalSet = false) => {
    try {
      // Get all tracks to find the one to update
      const tracks = isGlobalSet 
        ? await FirebaseService.getGlobalSetTracks(setlistId)
        : await FirebaseService.getSetlistTracks(setlistId);
        
      const trackToUpdate = tracks.find(
        (track) =>
          track.title?.toLowerCase() === title?.toLowerCase() &&
          track.artist?.toLowerCase() === artist?.toLowerCase()
      );

      if (trackToUpdate) {
        const music = matchData.metadata.music?.[0];
        if (isGlobalSet) {
          // For global sets, the update is handled in addTrackToGlobalSet with deduplication
          await FirebaseService.addTrackToGlobalSet(setlistId, {
            ...trackToUpdate,
            score: music.score,
            acrCloudData: music,
            identifiedAt: new Date().toISOString(),
          });
        } else {
          await FirebaseService.updateTrack(setlistId, trackToUpdate.id, {
            score: music.score,
            acrCloudData: music,
            identifiedAt: new Date().toISOString(),
          });
        }
        console.log("[useAudioIdentification] Track updated in Firebase");
      }
    } catch (err) {
      console.error(
        "[useAudioIdentification] Failed to update track in Firebase:",
        err
      );
    }
  };

  const clearError = () => setError(null);
  const clearMatches = () => setMatchResults([]);

  return {
    // State
    isRecording,
    isIdentifying,
    matchResults,
    error,
    currentSetlistId,
    isGlobalSet,
    numberOfUsers,
    debugInfo,

    // Actions
    startRecording,
    stopRecording,
    clearError,
    clearMatches,
  };
};

export default useAudioIdentification;
