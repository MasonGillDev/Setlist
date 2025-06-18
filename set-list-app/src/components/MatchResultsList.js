import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MatchResultsList = ({ matchResults }) => {
  if (matchResults.length === 0) return null;

  return (
    <View style={styles.resultsSection}>
      <Text style={styles.sectionTitle}>
        Identified Songs ({matchResults.length})
      </Text>
      {matchResults.map((match, index) => {
        const music = match.metadata.music?.[0];
        if (!music) return null;

        return (
          <View key={match.id} style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultNumber}>#{index + 1}</Text>
              <View style={styles.resultHeaderRight}>
                <Text style={styles.confidenceScore}>
                  {music.score}% match
                </Text>
                <Text style={styles.resultTime}>
                  {new Date(match.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
            <Text style={styles.resultText}>
              <Text style={styles.resultLabel}>Title: </Text>
              {music.title || "Unknown"}
            </Text>
            <Text style={styles.resultText}>
              <Text style={styles.resultLabel}>Artist: </Text>
              {music.artists?.map((a) => a.name).join(", ") || "Unknown"}
            </Text>
            <Text style={styles.resultText}>
              <Text style={styles.resultLabel}>Album: </Text>
              {music.album?.name || "Unknown"}
            </Text>
            {music.release_date && (
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Released: </Text>
                {music.release_date}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  resultsSection: {
    width: "100%",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultHeaderRight: {
    alignItems: "flex-end",
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  confidenceScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34C759",
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 12,
    color: "#999",
  },
  resultText: {
    fontSize: 15,
    marginBottom: 5,
    color: "#333",
  },
  resultLabel: {
    fontWeight: "600",
    color: "#666",
  },
});

export default MatchResultsList;