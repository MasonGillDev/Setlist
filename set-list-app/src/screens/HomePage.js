import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import useAudioIdentification from "../hooks/useAudioIdentification";
import SetNameModal from "../components/SetNameModal";
import JoinSetModal from "../components/JoinSetModal";
import MatchResultsList from "../components/MatchResultsList";
import RecordingStatus from "../components/RecordingStatus";
import ErrorMessage from "../components/ErrorMessage";
import { Colors } from "../constants/colors";

const HomePage = () => {
  const {
    isRecording,
    isIdentifying,
    matchResults,
    error,
    isGlobalSet,
    numberOfUsers,
    currentSetlistId,
    startRecording,
    stopRecording,
  } = useAudioIdentification();

  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleStartRecording = () => {
    setShowModal(true);
  };

  const handleConfirmRecording = async (setInfo) => {
    console.log('[HomePage] Confirm recording with info:', setInfo);
    setShowModal(false);
    
    try {
      console.log('[HomePage] Calling startRecording...');
      await startRecording(setInfo);
      console.log('[HomePage] Recording started successfully');
      console.log('[HomePage] Current recording state:', isRecording);
    } catch (error) {
      console.error('[HomePage] Error starting recording:', error);
      Alert.alert(
        'Recording Error',
        error.message || 'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelRecording = () => {
    setShowModal(false);
  };

  const handleJoinSet = () => {
    setShowJoinModal(true);
  };

  const handleConfirmJoin = async (globalSet) => {
    console.log('[HomePage] Joining global set:', globalSet);
    setShowJoinModal(false);
    
    try {
      console.log('[HomePage] Calling startRecording for global set...');
      // Start recording with the global set data
      await startRecording({
        name: globalSet.name,
        venue: globalSet.venue,
        globalSetId: globalSet.id,
        isGlobal: true,
      });
      console.log('[HomePage] Joined global set successfully');
      console.log('[HomePage] Current recording state:', isRecording);
    } catch (error) {
      console.error('[HomePage] Error joining global set:', error);
      Alert.alert(
        'Join Set Error',
        error.message || 'Failed to join set. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelJoin = () => {
    setShowJoinModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Set List</Text>

        <TouchableOpacity
          style={[styles.button, isRecording && styles.buttonRecording]}
          onPress={isRecording ? stopRecording : handleStartRecording}
          disabled={isIdentifying}
        >
          <Text style={styles.buttonText}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>

        {!isRecording && (
          <TouchableOpacity
            style={[styles.button, styles.buttonJoin]}
            onPress={handleJoinSet}
          >
            <Text style={styles.buttonText}>Join Set</Text>
          </TouchableOpacity>
        )}

        <RecordingStatus 
          isRecording={isRecording} 
          isIdentifying={isIdentifying}
          isGlobalSet={isGlobalSet}
          numberOfUsers={numberOfUsers}
        />
        
        <ErrorMessage error={error} />

        <MatchResultsList 
          matchResults={matchResults} 
          setlistId={currentSetlistId}
          isGlobalSet={isGlobalSet}
        />

        <SetNameModal
          visible={showModal}
          onConfirm={handleConfirmRecording}
          onCancel={handleCancelRecording}
        />

        <JoinSetModal
          visible={showJoinModal}
          onJoin={handleConfirmJoin}
          onCancel={handleCancelJoin}
        />
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
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    marginTop: 20,
    color: Colors.primary.teal,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary.teal,
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 30,
    marginBottom: 30,
    elevation: 5,
    shadowColor: Colors.primary.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonRecording: {
    backgroundColor: Colors.accent.orange,
  },
  buttonJoin: {
    backgroundColor: Colors.primary.tealDark,
    marginTop: -15,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default HomePage;
