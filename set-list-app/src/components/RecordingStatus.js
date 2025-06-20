import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const RecordingStatus = ({ isRecording, isIdentifying, numberOfUsers = 1, isGlobalSet = false }) => {
  return (
    <>
      {isRecording && (
        <View style={styles.statusContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.statusText}>Recording...</Text>
          {isGlobalSet && numberOfUsers > 0 && (
            <View style={styles.contributorsContainer}>
              <Text style={styles.contributorsText}>
                {numberOfUsers} {numberOfUsers === 1 ? 'contributor' : 'contributors'}
              </Text>
            </View>
          )}
        </View>
      )}

      {isIdentifying && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={Colors.primary.teal} />
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
    backgroundColor: Colors.accent.orange,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  contributorsContainer: {
    marginLeft: 'auto',
    backgroundColor: Colors.accent.orange,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contributorsText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
});

export default RecordingStatus;