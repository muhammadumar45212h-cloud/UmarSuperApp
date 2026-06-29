// screens/HomeScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av'; // Ya jo bhi player aap use kar rahe hain

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: 'YOUR_VIDEO_URL' }}
        style={styles.fullScreenVideo}
        resizeMode="cover"
        shouldPlay
        isLooping
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullScreenVideo: { width: '100%', height: '100%' },
});
