import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

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
    backgroundColor: Colors.semantic.error + '20',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 14,
    textAlign: "center",
  },
});

export default ErrorMessage;