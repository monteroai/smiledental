import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JobsScreen from './JobsScreen';
import JobPostingScreen from './JobPostingScreen';
import ApplicationsScreen from './ApplicationsScreen';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  profession_type?: string;
  dental_office_name?: string;
}

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'jobs' | 'post' | 'applications' | 'profile';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jobs':
        return <JobsScreen user={user} />;
      case 'post':
        return user.role === 'client' ? <JobPostingScreen user={user} /> : null;
      case 'applications':
        return <ApplicationsScreen user={user} />;
      case 'profile':
        return (
          <View style={styles.profileContainer}>
            <Text style={styles.profileName}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profileRole}>
              {user.role === 'client' ? 'Dental Office Client' : 'Dental Professional'}
            </Text>
            {user.profession_type && (
              <Text style={styles.profileDetail}>
                {user.profession_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            )}
            {user.dental_office_name && (
              <Text style={styles.profileDetail}>{user.dental_office_name}</Text>
            )}
            
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    ...(user.role === 'client' ? [{ key: 'post' as Tab, label: 'Post Job', icon: 'add-circle-outline' }] : []),
    { key: 'applications', label: 'Applications', icon: 'document-text-outline' },
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smile Dental Temps</Text>
        <Text style={styles.headerSubtitle}>
          Welcome, {user.first_name}!
        </Text>
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.key ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#2196F3',
    fontWeight: '500',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  profileRole: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2196F3',
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;