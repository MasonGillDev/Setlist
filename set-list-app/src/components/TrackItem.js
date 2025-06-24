import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/colors";
import FirebaseService from "../services/FirebaseService";

const TrackItem = ({
  track,
  index,
  onPress,
  showScore = true,
  setlistId = null,
  isGlobalSet = false,
}) => {
  const [likes, setLikes] = useState(track.likes || 0);
  const [dislikes, setDislikes] = useState(track.dislikes || 0);
  const [userVote, setUserVote] = useState(track.userVote || null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Voting is only enabled if we have both setlistId and track.id
  const canVote = !!(setlistId && track.id && track.id !== track.timestamp);

  // Generate a simple user ID for demo purposes
  if (!global.userId) {
    global.userId = Date.now().toString();
  }
  const userId = "user_" + global.userId;

  useEffect(() => {
    // Set initial vote state if available
    if (track.userVotes && track.userVotes[userId]) {
      setUserVote(track.userVotes[userId]);
    }
  }, [track]);

  const handleVote = async (voteType) => {
    if (isUpdating) return;

    // Check if we have necessary IDs for voting
    if (!setlistId || !track.id) {
      console.log("[TrackItem] Cannot vote - missing setlistId or track.id");
      return;
    }

    setIsUpdating(true);

    try {
      let newLikes = likes;
      let newDislikes = dislikes;
      let newUserVote = voteType;

      // If user is changing their vote
      if (userVote === "like" && voteType === "dislike") {
        newLikes = Math.max(0, likes - 1);
        newDislikes = dislikes + 1;
      } else if (userVote === "dislike" && voteType === "like") {
        newDislikes = Math.max(0, dislikes - 1);
        newLikes = likes + 1;
      } else if (userVote === voteType) {
        // User is removing their vote
        if (voteType === "like") {
          newLikes = Math.max(0, likes - 1);
        } else {
          newDislikes = Math.max(0, dislikes - 1);
        }
        newUserVote = null;
      } else {
        // New vote
        if (voteType === "like") {
          newLikes = likes + 1;
        } else {
          newDislikes = dislikes + 1;
        }
      }

      // Update local state immediately for better UX
      setLikes(newLikes);
      setDislikes(newDislikes);
      setUserVote(newUserVote);

      // Update Firebase
      if (setlistId && track.id) {
        console.log("[TrackItem] Updating vote in Firebase:", {
          setlistId,
          trackId: track.id,
          userId,
          newUserVote,
          newLikes,
          newDislikes,
          isGlobalSet,
        });

        await FirebaseService.updateTrackVote(
          setlistId,
          track.id,
          userId,
          newUserVote,
          newLikes,
          newDislikes,
          isGlobalSet
        );
      } else {
        console.log(
          "[TrackItem] Cannot update vote - missing setlistId or track.id:",
          {
            setlistId,
            trackId: track.id,
          }
        );
      }
    } catch (error) {
      console.error("Error updating vote:", error);
      // Revert on error
      setLikes(track.likes || 0);
      setDislikes(track.dislikes || 0);
      setUserVote(track.userVote || null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.trackNumber}>
        <Text style={styles.trackNumberText}>{index + 1}</Text>
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title || "Unknown"}</Text>
        <Text style={styles.trackArtist}>
          {track.artist ||
            track.artists?.map((a) => a.name).join(", ") ||
            "Unknown"}
        </Text>
        {track.album && <Text style={styles.trackAlbum}>{track.album}</Text>}
      </View>

      <View style={styles.rightSection}>
        {showScore && track.score && (
          <Text style={styles.trackScore}>{track.score}%</Text>
        )}

        <View style={styles.voteContainer}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote === "like" && styles.voteButtonActive,
              !canVote && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote("like")}
            disabled={isUpdating || !canVote}
          >
            <Ionicons
              name={userVote === "like" ? "thumbs-up" : "thumbs-up-outline"}
              size={20}
              color={
                !canVote
                  ? Colors.neutral.gray400
                  : userVote === "like"
                  ? Colors.semantic.success
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.voteCount,
                userVote === "like" && styles.voteCountActive,
                !canVote && styles.voteCountDisabled,
              ]}
            >
              {likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote === "dislike" && styles.voteButtonActive,
              !canVote && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote("dislike")}
            disabled={isUpdating || !canVote}
          >
            <Ionicons
              name={
                userVote === "dislike" ? "thumbs-down" : "thumbs-down-outline"
              }
              size={20}
              color={
                !canVote
                  ? Colors.neutral.gray400
                  : userVote === "dislike"
                  ? Colors.semantic.error
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.voteCount,
                userVote === "dislike" && styles.voteCountActive,
                !canVote && styles.voteCountDisabled,
              ]}
            >
              {dislikes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent.orange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trackNumberText: {
    color: Colors.text.inverse,
    fontWeight: "600",
    fontSize: 14,
  },
  trackInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  trackScore: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary.teal,
    marginBottom: 8,
  },
  voteContainer: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.neutral.gray100,
    gap: 4,
  },
  voteButtonActive: {
    backgroundColor: Colors.primary.tealLight,
  },
  voteCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  voteCountActive: {
    color: Colors.text.primary,
    fontWeight: "600",
  },
  voteButtonDisabled: {
    backgroundColor: Colors.neutral.gray50,
    opacity: 0.6,
  },
  voteCountDisabled: {
    color: Colors.neutral.gray400,
  },
});

export default TrackItem;
