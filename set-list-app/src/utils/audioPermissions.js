import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export const checkAudioPermissions = async () => {
  try {
    console.log('[AudioPermissions] Checking audio permissions...');
    console.log('[AudioPermissions] Platform:', Platform.OS);
    
    // First check current permission status
    const { status: currentStatus } = await Audio.getPermissionsAsync();
    console.log('[AudioPermissions] Current permission status:', currentStatus);
    
    if (currentStatus === 'granted') {
      console.log('[AudioPermissions] Permissions already granted');
      return { granted: true, status: currentStatus };
    }
    
    // Request permissions if not granted
    console.log('[AudioPermissions] Requesting permissions...');
    const { status: newStatus, canAskAgain, granted } = await Audio.requestPermissionsAsync();
    
    console.log('[AudioPermissions] Permission response:', {
      status: newStatus,
      canAskAgain,
      granted,
    });
    
    return { 
      granted: newStatus === 'granted', 
      status: newStatus,
      canAskAgain 
    };
  } catch (error) {
    console.error('[AudioPermissions] Error checking permissions:', error);
    return { 
      granted: false, 
      status: 'error',
      error: error.message 
    };
  }
};

export const testAudioRecording = async () => {
  try {
    console.log('[AudioPermissions] Testing audio recording capability...');
    
    // Set audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    // Try to create a test recording
    const testRecording = new Audio.Recording();
    await testRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await testRecording.startAsync();
    
    // Record for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRecording.stopAndUnloadAsync();
    const uri = testRecording.getURI();
    
    console.log('[AudioPermissions] Test recording successful, URI:', uri);
    return { success: true, uri };
  } catch (error) {
    console.error('[AudioPermissions] Test recording failed:', error);
    return { success: false, error: error.message };
  }
};