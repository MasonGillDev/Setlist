import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ErrorMessage = ({ error }) => {
  if (!error) return null;

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default ErrorMessage;