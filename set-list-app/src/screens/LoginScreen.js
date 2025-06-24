import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/colors';

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      await register(email.trim(), password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set List</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary.teal,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: Colors.background.secondary,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary.teal,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  registerButton: {
    backgroundColor: Colors.primary.tealDark,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  error: {
    color: Colors.semantic.error,
    marginBottom: 10,
  },
});

export default LoginScreen;
