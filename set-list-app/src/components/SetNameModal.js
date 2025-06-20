import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';

const SetNameModal = ({ visible, onConfirm, onCancel }) => {
  const [setName, setSetName] = useState('');
  const [venue, setVenue] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [isGlobalSet, setIsGlobalSet] = useState(false);

  useEffect(() => {
    if (visible && isGlobalSet) {
      getLocation();
    }
  }, [visible, isGlobalSet]);

  const getLocation = async () => {
    try {
      setGettingLocation(true);
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission if not granted
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        status = permissionResult.status;
      }
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        // If permission denied, turn off global set
        setIsGlobalSet(false);
        alert('Location permission is required for global sets. Others won\'t be able to find your set without location.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setIsGlobalSet(false);
      alert('Could not get location. Global set requires location access.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleConfirm = () => {
    const name = setName.trim() || `Recording Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    onConfirm({ 
      name, 
      venue: venue.trim() || null,
      coordinates: isGlobalSet ? coordinates : null,
      isGlobal: isGlobalSet,
    });
    setSetName('');
    setVenue('');
    setCoordinates(null);
    setIsGlobalSet(false);
  };

  const handleCancel = () => {
    setSetName('');
    setVenue('');
    setCoordinates(null);
    setIsGlobalSet(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Recording Session</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Set Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Friday Night at Blue Note"
              value={setName}
              onChangeText={setSetName}
              autoFocus={true}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Venue (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., The Blue Note"
              value={venue}
              onChangeText={setVenue}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>

          <View style={styles.toggleContainer}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Make this a Global Set</Text>
              <Switch
                value={isGlobalSet}
                onValueChange={setIsGlobalSet}
                trackColor={{ false: Colors.neutral.gray300, true: Colors.primary.teal }}
                thumbColor={isGlobalSet ? Colors.accent.orange : Colors.neutral.gray100}
                ios_backgroundColor={Colors.neutral.gray300}
              />
            </View>
            <Text style={styles.toggleDescription}>
              {isGlobalSet 
                ? "Others nearby can join and contribute to this set" 
                : "This will be a personal set only you can see"}
            </Text>
          </View>

          {gettingLocation && (
            <View style={styles.locationStatus}>
              <ActivityIndicator size="small" color={Colors.primary.teal} />
              <Text style={styles.locationText}>Getting location...</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: Colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text.primary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.background.tertiary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.neutral.gray100,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: Colors.accent.orange,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  toggleContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

export default SetNameModal;