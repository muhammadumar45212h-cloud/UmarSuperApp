// screens/ProfileScreen.js (Snippet)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ProfileScreen() {
  const handlePayment = (method) => {
    Alert.alert("Payment", method + " integration on process... Redirecting to Gateway.");
    // Yahan aap apna API call logic lagayenge
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Wallet</Text>
      <TouchableOpacity style={styles.payButton} onPress={() => handlePayment('JazzCash')}>
        <Text style={styles.payText}>Pay with JazzCash</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.payButton} onPress={() => handlePayment('EasyPaisa')}>
        <Text style={styles.payText}>Pay with EasyPaisa</Text>
      </TouchableOpacity>
    </View>
  );
}
