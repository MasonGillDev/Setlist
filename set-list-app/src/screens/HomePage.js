import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import useAudioIdentification from "../hooks/useAudioIdentification";
import SetNameModal from "../components/SetNameModal";
import MatchResultsList from "../components/MatchResultsList";
import RecordingStatus from "../components/RecordingStatus";
import ErrorMessage from "../components/ErrorMessage";

const HomePage = () => {
  const {
    isRecording,
    isIdentifying,
    matchResults,
    error,
    startRecording,
    stopRecording,
  } = useAudioIdentification();

  const [showModal, setShowModal] = useState(false);

  const handleStartRecording = () => {
    setShowModal(true);
  };

  const handleConfirmRecording = (setInfo) => {
    setShowModal(false);
    startRecording(setInfo);
  };

  const handleCancelRecording = () => {
    setShowModal(false);
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

        <RecordingStatus isRecording={isRecording} isIdentifying={isIdentifying} />
        
        <ErrorMessage error={error} />

        <MatchResultsList matchResults={matchResults} />

        <SetNameModal
          visible={showModal}
          onConfirm={handleConfirmRecording}
          onCancel={handleCancelRecording}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    marginTop: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonRecording: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default HomePage;
