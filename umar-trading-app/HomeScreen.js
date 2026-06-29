import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        shouldPlay={true}
        isLooping={true}
        isMuted={false}
      />

      {/* User Info Overlay (Bottom Left) */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>@UmarDev</Text>
        <Text style={styles.description}>Trillionaire journey starts with a code! 🚀</Text>
      </View>

      {/* Side Overlay Icons (Right Side) */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>❤️</Text>
          <Text style={styles.countText}>1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>💬</Text>
          <Text style={styles.countText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>📤</Text>
          <Text style={styles.countText}>0</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { 
    position: 'absolute', 
    right: 15, 
    bottom: 100, 
    alignItems: 'center' 
  },
  iconButton: { marginVertical: 15, alignItems: 'center' },
  iconText: { fontSize: 35 },
  countText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  userInfo: { 
    position: 'absolute', 
    bottom: 80, 
    left: 15, 
    width: width * 0.7 
  },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  description: { color: '#fff', fontSize: 14, marginTop: 5 }
});
