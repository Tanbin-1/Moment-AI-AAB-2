import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAppContext } from '../context/AppContext';

const STORAGE_KEY_URL = 'SUPABASE_URL';
const STORAGE_KEY_KEY = 'SUPABASE_ANON_KEY';

interface SupabaseConfigProps {
  onConfigSaved: (url: string, key: string) => void;
}

export default function SupabaseConfig({ onConfigSaved }: SupabaseConfigProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useAppContext();

  // For development - initialize with known values if available
  useEffect(() => {
    if (__DEV__) {
      const defaultUrl = 'https://njzgerlnscqjmctfkoqd.supabase.co';
      const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qemdlcmxuc2Nxam1jdGZrb3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTA5MjMsImV4cCI6MjA2MDU2NjkyM30.xHEFnSu06wNEcrjjVz0mcuAUKVpeStxF68v9YTScgn8';
      setSupabaseUrl(defaultUrl);
      setSupabaseKey(defaultKey);
    }
  }, []);

  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Checking Supabase configuration...');
      
      // Log platform information for debugging
      console.log(`Platform: ${Platform.OS}`);
      
      // Check if we have environment variables
      const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const extraUrl = Constants.expoConfig?.extra?.supabaseUrl;
      const extraKey = Constants.expoConfig?.extra?.supabaseAnonKey;
      
      console.log(`Environment variables available: ${!!envUrl && !!envKey}`);
      console.log(`App config variables available: ${!!extraUrl && !!extraKey}`);
      
      // Check saved values
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
      const savedKey = await AsyncStorage.getItem(STORAGE_KEY_KEY);
      
      console.log(`Saved values available: ${!!savedUrl && !!savedKey}`);
      
      if ((envUrl && envKey) || (extraUrl && extraKey)) {
        // We have config from environment, use that
        console.log('Using environment or app config variables');
        if (envUrl && envKey) {
          onConfigSaved(envUrl, envKey);
        } else if (extraUrl && extraKey) {
          onConfigSaved(extraUrl, extraKey);
        }
        return;
      }
      
      if (savedUrl && savedKey) {
        // Use saved values
        console.log('Using saved credentials');
        onConfigSaved(savedUrl, savedKey);
        return;
      }
      
      // No config found, show modal
      console.log('No Supabase configuration found, showing modal');
      setVisible(true);
    } catch (error) {
      console.error('Error checking Supabase config:', error);
      setError('Failed to check Supabase configuration. Please try again.');
      setVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Please enter both Supabase URL and anon key');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate URL format
      if (!supabaseUrl.startsWith('https://')) {
        setError('Supabase URL must start with https://');
        setIsLoading(false);
        return;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY_URL, supabaseUrl);
      await AsyncStorage.setItem(STORAGE_KEY_KEY, supabaseKey);
      console.log('Supabase credentials saved successfully');
      
      onConfigSaved(supabaseUrl, supabaseKey);
      setVisible(false);
    } catch (error) {
      console.error('Error saving Supabase config:', error);
      setError('Failed to save Supabase configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(18, 23, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
      ]}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDarkMode ? '#1e293b' : 'white' }
        ]}>
          <Text style={[
            styles.title,
            { color: isDarkMode ? 'white' : '#1e293b' }
          ]}>
            Supabase Configuration
          </Text>
          
          <Text style={[
            styles.description,
            { color: isDarkMode ? '#cbd5e1' : '#475569' }
          ]}>
            Please enter your Supabase URL and anon key to continue.
            You can find these in your Supabase project settings.
          </Text>
          
          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
          
          <Text style={[
            styles.label,
            { color: isDarkMode ? '#cbd5e1' : '#475569' }
          ]}>
            Supabase URL
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                color: isDarkMode ? 'white' : 'black',
                borderColor: isDarkMode ? '#475569' : '#e2e8f0'
              }
            ]}
            value={supabaseUrl}
            onChangeText={setSupabaseUrl}
            placeholder="https://your-project.supabase.co"
            placeholderTextColor={isDarkMode ? '#94a3b8' : '#94a3b8'}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isLoading}
          />
          
          <Text style={[
            styles.label,
            { color: isDarkMode ? '#cbd5e1' : '#475569' }
          ]}>
            Supabase Anon Key
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                color: isDarkMode ? 'white' : 'black',
                borderColor: isDarkMode ? '#475569' : '#e2e8f0'
              }
            ]}
            value={supabaseKey}
            onChangeText={setSupabaseKey}
            placeholder="your-anon-key"
            placeholderTextColor={isDarkMode ? '#94a3b8' : '#94a3b8'}
            autoCapitalize="none"
            editable={!isLoading}
          />
          
          <TouchableOpacity
            style={[
              styles.button,
              { opacity: (!supabaseUrl || !supabaseKey || isLoading) ? 0.5 : 1 }
            ]}
            onPress={handleSave}
            disabled={!supabaseUrl || !supabaseKey || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    fontSize: 14,
  },
});
