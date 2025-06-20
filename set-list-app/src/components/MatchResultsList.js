import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import TrackItem from './TrackItem';

const MatchResultsList = ({ matchResults, setlistId = null, isGlobalSet = false }) => {
  if (matchResults.length === 0) return null;

  return (
    <View style={styles.resultsSection}>
      <Text style={styles.sectionTitle}>
        Identified Songs ({matchResults.length})
      </Text>
      {matchResults.map((match, index) => {
        const music = match.metadata.music?.[0];
        if (!music) return null;

        // Create a track object compatible with TrackItem
        const track = {
          id: match.firebaseTrackId || match.id, // Use Firebase ID if available
          title: music.title,
          artist: music.artists?.map((a) => a.name).join(", "),
          artists: music.artists,
          album: music.album?.name,
          score: music.score,
          releaseDate: music.release_date,
          timestamp: match.timestamp,
          likes: match.likes || 0,
          dislikes: match.dislikes || 0,
          userVotes: match.userVotes || {},
          acrCloudData: music,
        };

        return (
          <TrackItem
            key={match.id}
            track={track}
            index={index}
            showScore={true}
            setlistId={setlistId}
            isGlobalSet={isGlobalSet}
          />
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
    color: Colors.text.primary,
    textAlign: "center",
  },
});

export default MatchResultsList;