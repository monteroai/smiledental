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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  office_address?: string;
  office_city?: string;
  office_state?: string;
  office_zip?: string;
  office_latitude?: number;
  office_longitude?: number;
}

interface JobPostingScreenProps {
  user: User;
}

interface JobFormData {
  title: string;
  job_type: string;
  description: string;
  hourly_rate: string;
  location_address: string;
  location_city: string;
  location_state: string;
  location_zip: string;
  job_date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  recurring_days?: string[];
  recurring_end_date?: string;
}

const JobPostingScreen: React.FC<JobPostingScreenProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<JobFormData>({
    defaultValues: {
      location_address: user.office_address || '',
      location_city: user.office_city || '',
      location_state: user.office_state || '',
      location_zip: user.office_zip || '',
      is_recurring: false,
      recurring_pattern: 'weekly',
      recurring_days: [],
    }
  });

  const watchIsRecurring = watch('is_recurring');
  const watchRecurringPattern = watch('recurring_pattern');

  const jobTypes = [
    { value: 'dental_hygienist', label: 'Dental Hygienist' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'dental_assistant', label: 'Dental Assistant' },
    { value: 'front_desk', label: 'Front Desk Personnel' },
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const onSubmit = async (data: JobFormData) => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('access_token');
      
      // Convert form data to API format
      const jobData = {
        ...data,
        hourly_rate: parseFloat(data.hourly_rate),
        job_date: new Date(data.job_date + 'T00:00:00.000Z').toISOString(),
        location_latitude: user.office_latitude || 0,
        location_longitude: user.office_longitude || 0,
        recurring_end_date: data.recurring_end_date ? 
          new Date(data.recurring_end_date + 'T00:00:00.000Z').toISOString() : undefined,
      };

      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/jobs`, jobData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Job posted successfully!');
      reset();
    } catch (error: any) {
      console.error('Error posting job:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to post job. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderJobTypeSelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Position Type</Text>
      <Controller
        control={control}
        name="job_type"
        rules={{ required: 'Please select a position type' }}
        render={({ field: { onChange, value } }) => (
          <View style={styles.radioGroup}>
            {jobTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.radioOption}
                onPress={() => onChange(type.value)}
              >
                <View style={[styles.radioCircle, value === type.value && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {errors.job_type && (
        <Text style={styles.errorText}>{errors.job_type.message}</Text>
      )}
    </View>
  );

  const renderRecurringOptions = () => {
    if (!watchIsRecurring) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recurring Settings</Text>
        
        <Controller
          control={control}
          name="recurring_pattern"
          render={({ field: { onChange, value } }) => (
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onChange('weekly')}
              >
                <View style={[styles.radioCircle, value === 'weekly' && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onChange('monthly')}
              >
                <View style={[styles.radioCircle, value === 'monthly' && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>Monthly</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {watchRecurringPattern === 'weekly' && (
          <Controller
            control={control}
            name="recurring_days"
            render={({ field: { onChange, value = [] } }) => (
              <View>
                <Text style={styles.label}>Select Days</Text>
                <View style={styles.daysGrid}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        value.includes(day.value) && styles.dayButtonSelected
                      ]}
                      onPress={() => {
                        const updatedDays = value.includes(day.value)
                          ? value.filter(d => d !== day.value)
                          : [...value, day.value];
                        onChange(updatedDays);
                      }}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        value.includes(day.value) && styles.dayButtonTextSelected
                      ]}>
                        {day.label.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          />
        )}

        <Controller
          control={control}
          name="recurring_end_date"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="YYYY-MM-DD"
              />
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Post a New Job</Text>
        <Text style={styles.subtitle}>Fill in the details to attract qualified dental professionals</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="title"
          rules={{ required: 'Job title is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g., Dental Hygienist - Weekend Coverage"
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title.message}</Text>
              )}
            </View>
          )}
        />

        {renderJobTypeSelector()}

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Describe the role, requirements, and any additional details..."
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="hourly_rate"
          rules={{ required: 'Hourly rate is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hourly Rate ($) *</Text>
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter hourly rate"
                keyboardType="numeric"
              />
              {errors.hourly_rate && (
                <Text style={styles.errorText}>{errors.hourly_rate.message}</Text>
              )}
            </View>
          )}
        />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Controller
            control={control}
            name="location_address"
            rules={{ required: 'Address is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter street address"
                />
                {errors.location_address && (
                  <Text style={styles.errorText}>{errors.location_address.message}</Text>
                )}
              </View>
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="location_city"
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
                  {errors.location_city && (
                    <Text style={styles.errorText}>{errors.location_city.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="location_state"
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
                  {errors.location_state && (
                    <Text style={styles.errorText}>{errors.location_state.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="location_zip"
            rules={{ required: 'ZIP code is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>ZIP Code *</Text>
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="ZIP code"
                  keyboardType="numeric"
                />
                {errors.location_zip && (
                  <Text style={styles.errorText}>{errors.location_zip.message}</Text>
                )}
              </View>
            )}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <Controller
            control={control}
            name="job_date"
            rules={{ required: 'Job date is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="YYYY-MM-DD"
                />
                {errors.job_date && (
                  <Text style={styles.errorText}>{errors.job_date.message}</Text>
                )}
              </View>
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="start_time"
              rules={{ required: 'Start time is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>Start Time *</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="09:00"
                  />
                  {errors.start_time && (
                    <Text style={styles.errorText}>{errors.start_time.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="end_time"
              rules={{ required: 'End time is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
                  <Text style={styles.label}>End Time *</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="17:00"
                  />
                  {errors.end_time && (
                    <Text style={styles.errorText}>{errors.end_time.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="is_recurring"
            render={({ field: { onChange, value } }) => (
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Make this a recurring job</Text>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={value ? "#2196F3" : "#f4f3f4"}
                />
              </View>
            )}
          />

          {renderRecurringOptions()}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
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
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  radioGroup: {
    marginBottom: 8,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
});

export default JobPostingScreen;