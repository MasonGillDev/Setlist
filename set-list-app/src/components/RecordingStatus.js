import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const RecordingStatus = ({ isRecording, isIdentifying }) => {
  return (
    <>
      {isRecording && (
        <View style={styles.statusContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.statusText}>Recording...</Text>
        </View>
      )}

      {isIdentifying && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.statusText}>Identifying...</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: "#666",
  },
});

export default RecordingStatus;