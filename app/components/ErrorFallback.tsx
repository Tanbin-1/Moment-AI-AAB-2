import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  isDarkMode?: boolean;
}

const ErrorFallback = ({ error, resetError, isDarkMode = false }: ErrorFallbackProps) => {
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121726' : '#f9fafb' }]}>
      <View style={[styles.content, { backgroundColor: isDarkMode ? '#1e293b' : 'white' }]}>
        <Text style={[styles.title, { color: isDarkMode ? 'white' : '#1e293b' }]}>
          Oops! Something went wrong
        </Text>
        
        <Text style={[styles.message, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
          The app encountered an unexpected error. Here's what happened:
        </Text>
        
        <ScrollView style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: isDarkMode ? '#f87171' : '#ef4444' }]}>
            {error.message || 'Unknown error'}
          </Text>
        </ScrollView>
        
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionText, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
            Try the following:
          </Text>
          
          <Text style={[styles.bulletPoint, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
            • Check your Supabase URL and anon key
          </Text>
          
          <Text style={[styles.bulletPoint, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
            • Verify your internet connection
          </Text>
          
          <Text style={[styles.bulletPoint, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
            • Restart the app
          </Text>
          
          <Text style={[styles.bulletPoint, { color: isDarkMode ? '#e2e8f0' : '#475569' }]}>
            • Ensure Supabase is running properly
          </Text>
        </View>
        
        {resetError && (
          <TouchableOpacity
            style={styles.button}
            onPress={resetError}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorContainer: {
    maxHeight: 120,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3B82F6',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorFallback;
