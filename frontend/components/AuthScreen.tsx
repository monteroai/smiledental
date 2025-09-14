import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  // Professional fields
  profession_type?: string;
  license_number?: string;
  experience_years?: string;
  // Client fields
  dental_office_name?: string;
  office_address?: string;
  office_city?: string;
  office_state?: string;
  office_zip?: string;
}

interface AuthScreenProps {
  onLogin: (token: string, userData: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [activePortal, setActivePortal] = useState<'client' | 'professional'>('professional');
  const [loading, setLoading] = useState(false);
  
  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm<AuthFormData>();
  
  const watchRole = watch('role');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  const onSubmit = async (data: AuthFormData) => {
    if (!isLogin && data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const requestData = isLogin 
        ? { email: data.email, password: data.password }
        : {
            ...data,
            role: activePortal,
            experience_years: data.experience_years ? parseInt(data.experience_years) : undefined
          };

      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api${endpoint}`, requestData);
      
      if (response.data.access_token) {
        // Get user info
        const userResponse = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`
          }
        });
        
        await onLogin(response.data.access_token, userResponse.data);
        Alert.alert('Success', isLogin ? 'Welcome back!' : 'Account created successfully!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.detail || 'An error occurred. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPortalTabs = () => (
    <View style={styles.portalTabs}>
      <TouchableOpacity
        style={[styles.portalTab, activePortal === 'professional' && styles.activePortalTab]}
        onPress={() => setActivePortal('professional')}
      >
        <Text style={[styles.portalTabText, activePortal === 'professional' && styles.activePortalTabText]}>
          Dental Professional
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.portalTab, activePortal === 'client' && styles.activePortalTab]}
        onPress={() => setActivePortal('client')}
      >
        <Text style={[styles.portalTabText, activePortal === 'client' && styles.activePortalTabText]}>
          Dental Office Client
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfessionalFields = () => (
    <>
      <Text style={styles.sectionTitle}>Professional Information</Text>
      
      <Text style={styles.label}>Profession Type</Text>
      <View style={styles.radioGroup}>
        {[
          { value: 'dental_hygienist', label: 'Dental Hygienist' },
          { value: 'dentist', label: 'Dentist' },
          { value: 'dental_assistant', label: 'Dental Assistant' },
          { value: 'front_desk', label: 'Front Desk Personnel' }
        ].map((option) => (
          <Controller
            key={option.value}
            control={control}
            name="profession_type"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onChange(option.value)}
              >
                <View style={[styles.radioCircle, value === option.value && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>{option.label}</Text>
              </TouchableOpacity>
            )}
          />
        ))}
      </View>

      <Controller
        control={control}
        name="license_number"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Number (Optional)</Text>
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter your license number"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="experience_years"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Years of Experience (Optional)</Text>
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter years of experience"
              keyboardType="numeric"
            />
          </View>
        )}
      />
    </>
  );

  const renderClientFields = () => (
    <>
      <Text style={styles.sectionTitle}>Dental Office Information</Text>
      
      <Controller
        control={control}
        name="dental_office_name"
        rules={{ required: 'Office name is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dental Office Name *</Text>
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter your dental office name"
            />
            {errors.dental_office_name && (
              <Text style={styles.errorText}>{errors.dental_office_name.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="office_address"
        rules={{ required: 'Office address is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Office Address *</Text>
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter office street address"
            />
            {errors.office_address && (
              <Text style={styles.errorText}>{errors.office_address.message}</Text>
            )}
          </View>
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="office_city"
          rules={{ required: 'City is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="City"
              />
              {errors.office_city && (
                <Text style={styles.errorText}>{errors.office_city.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="office_state"
          rules={{ required: 'State is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="State"
              />
              {errors.office_state && (
                <Text style={styles.errorText}>{errors.office_state.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="office_zip"
        rules={{ required: 'ZIP code is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter ZIP code"
              keyboardType="numeric"
            />
            {errors.office_zip && (
              <Text style={styles.errorText}>{errors.office_zip.message}</Text>
            )}
          </View>
        )}
      />
    </>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Smile Dental Temps</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </Text>
      </View>

      {renderPortalTabs()}

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'Please enter a valid email'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter your password"
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>
          )}
        />

        {!isLogin && (
          <>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{ required: 'Please confirm your password' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Confirm your password"
                    secureTextEntry
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                  )}
                </View>
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="first_name"
                rules={{ required: 'First name is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputContainer, styles.flex1]}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="First name"
                    />
                    {errors.first_name && (
                      <Text style={styles.errorText}>{errors.first_name.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="last_name"
                rules={{ required: 'Last name is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Last name"
                    />
                    {errors.last_name && (
                      <Text style={styles.errorText}>{errors.last_name.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            />

            {activePortal === 'professional' && renderProfessionalFields()}
            {activePortal === 'client' && renderClientFields()}
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={toggleMode}>
          <Text style={styles.linkText}>
            {isLogin 
              ? "Don't have an account? Create one" 
              : "Already have an account? Sign in"
            }
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  portalTabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  portalTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePortalTab: {
    backgroundColor: '#2196F3',
  },
  portalTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePortalTabText: {
    color: '#ffffff',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#2196F3',
    fontSize: 14,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AuthScreen;