import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import FirebaseService from "../services/FirebaseService";

const JoinSetModal = ({ visible, onJoin, onCancel }) => {
  const [nearbySets, setNearbySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (visible) {
      loadNearbySets();
    }
  }, [visible]);

  const loadNearbySets = async () => {
    try {
      setLoading(true);
      setLocationError(null);

      // Get current location
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission not granted");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get nearby sets
      const sets = await FirebaseService.getNearbyGlobalSets(
        location.coords.latitude,
        location.coords.longitude,
        500 // 500 meters radius
      );

      setNearbySets(sets);
    } catch (error) {
      console.error("Error loading nearby sets:", error);
      setLocationError("Failed to load nearby sets");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSet = async (setData) => {
    try {
      // Join the global set
      await FirebaseService.joinGlobalSet(setData.id);

      // Pass the set data to parent
      onJoin(setData);
    } catch (error) {
      console.error("Error joining set:", error);
      Alert.alert("Error", "Failed to join set. Please try again.");
    }
  };

  const renderSetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.setItem}
      onPress={() => handleJoinSet(item)}
    >
      <View style={styles.setInfo}>
        <Text style={styles.setName}>{item.name}</Text>
        <Text style={styles.setVenue}>📍 {item.venue || "Unknown venue"}</Text>
        <View style={styles.setMeta}>
          <Text style={styles.setDistance}>{item.distance}m away</Text>
          <Text style={styles.setUsers}>
            {item.numberOfUsers} {item.numberOfUsers === 1 ? "user" : "users"}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={Colors.text.secondary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Nearby Sets</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.teal} />
              <Text style={styles.loadingText}>Finding nearby sets...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="location-outline"
                size={48}
                color={Colors.text.tertiary}
              />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadNearbySets}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : nearbySets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="musical-notes-outline"
                size={48}
                color={Colors.text.tertiary}
              />
              <Text style={styles.emptyText}>No active sets nearby</Text>
              <Text style={styles.emptySubtext}>
                Start your own set to get the party going!
              </Text>
            </View>
          ) : (
            <FlatList
              data={nearbySets}
              renderItem={renderSetItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary.teal,
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    padding: 60,
    alignItems: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.teal,
    borderRadius: 20,
  },
  retryText: {
    color: Colors.text.inverse,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 5,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 10,
  },
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background.secondary,
  },
  setInfo: {
    flex: 1,
    marginRight: 10,
  },
  setName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  setVenue: {
    fontSize: 14,
    color: Colors.primary.teal,
    marginBottom: 8,
  },
  setMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  setDistance: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 15,
  },
  setUsers: {
    fontSize: 14,
    color: Colors.accent.orange,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.gray200,
  },
});

export default JoinSetModal;
