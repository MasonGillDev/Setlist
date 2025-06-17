import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAudioIdentification from "../hooks/useAudioIdentification";

const HomePage = () => {
  const {
    isRecording,
    isIdentifying,
    matchResults,
    error,
    startRecording,
    stopRecording,
  } = useAudioIdentification();

  const renderMatchResults = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Set List</Text>

        <TouchableOpacity
          style={[styles.button, isRecording && styles.buttonRecording]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isIdentifying}
        >
          <Text style={styles.buttonText}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>

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

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderMatchResults()}
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
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
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

export default HomePage;
