import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from './Navigation'; // Ye aapki nayi file ko import karega

export default function App() {
  return (
    <NavigationContainer>
      <Navigation />
    </NavigationContainer>
  );
}
