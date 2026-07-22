import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from './supabaseClient'; // Apni pehle wali file connect ki

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Function
  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert(error.message);
    else Alert.alert('Account ban gaya! Email check karein.');
  }

  // Sign In Function
  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    else Alert.alert('Login successful!');
  }

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Email likhein" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />
      <Button title="Login" onPress={signIn} />
      <View style={{marginTop: 10}} />
      <Button title="Sign Up" onPress={signUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }
});
