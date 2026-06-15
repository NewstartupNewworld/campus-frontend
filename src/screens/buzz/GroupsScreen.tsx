import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  member_count: string;
  is_member: boolean;
}

const GROUP_ICONS = ['👥', '📚', '🎮', '⚽', '🎵', '🎨', '💻', '🍔', '🎬', '✈️', '📷', '🏆'];

const GroupCard = ({ group, onJoin, onOpen }: { group: Group; onJoin: (id: string) => void; onOpen: (group: Group) => void }) => (
  <TouchableOpacity style={gc.card} onPress={() => group.is_member && onOpen(group)} activeOpacity={0.8}>
    <View style={gc.iconWrap}>
      <Text style={gc.icon}>{group.icon}</Text>
    </View>
    <View style={gc.info}>
      <Text style={gc.name}>{group.name}</Text>
      <Text style={gc.desc} numberOfLines={1}>{group.description || 'No description'}</Text>
      <Text style={gc.members}>{group.member_count} members</Text>
    </View>
    {group.is_member ? (
      <View style={gc.joinedBadge}>
        <Text style={gc.joinedText}>Joined</Text>
      </View>
    ) : (
      <TouchableOpacity style={gc.joinBtn} onPress={() => onJoin(group.id)}>
        <Text style={gc.joinText}>Join</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const gc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 14, color: Colors.text },
  desc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  members: { fontSize: 11, color: Colors.textDim, marginTop: 3 },
  joinBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  joinedBadge: { backgroundColor: Colors.success + '18', borderRadius: 12, borderWidth: 1, borderColor: Colors.success + '44', paddingHorizontal: 12, paddingVertical: 8 },
  joinedText: { color: Colors.success, fontWeight: '700', fontSize: 12 },
});

const CreateGroupModal = ({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (name: string, description: string, icon: string) => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('👥');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), icon);
    setName('');
    setDescription('');
    setIcon('👥');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.handle} />
          <Text style={cm.title}>Create a Group</Text>

          <Text style={cm.label}>Choose an icon</Text>
          <View style={cm.iconGrid}>
            {GROUP_ICONS.map(i => (
              <TouchableOpacity key={i} style={[cm.iconOption, icon === i && cm.iconOptionActive]} onPress={() => setIcon(i)}>
                <Text style={cm.iconOptionText}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={cm.label}>Group Name</Text>
          <TextInput style={cm.input} value={name} onChangeText={setName} placeholder="e.g. CS Study Group" placeholderTextColor={Colors.textDim} maxLength={50} />

          <Text style={cm.label}>Description (optional)</Text>
          <TextInput
            style={[cm.input, cm.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this group about?"
            placeholderTextColor={Colors.textDim}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={150}
          />

          <View style={cm.btnRow}>
            <TouchableOpacity style={cm.cancelBtn} onPress={onClose}>
              <Text style={cm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cm.createBtn, !name.trim() && { opacity: 0.5 }]} onPress={handleCreate} disabled={!name.trim()}>
              <Text style={cm.createText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
  iconOptionText: { fontSize: 20 },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14 },
  textArea: { minHeight: 70 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: Colors.text, fontWeight: '700' },
  createBtn: { flex: 2, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '800' },
});

export const GroupsScreen = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setGroups(data.groups || []);
    } catch (e) {
      console.error('Fetch groups error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoin = async (groupId: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_member: true, member_count: String(parseInt(g.member_count) + 1) } : g));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error('Join error:', e);
    }
  };

  const handleCreate = async (name: string, description: string, icon: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, icon }),
      });
      if (response.ok) {
        fetchGroups();
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create group. Check your connection.');
    }
  };

  const handleOpen = (group: Group) => {
    (navigation as any).navigate('GroupChat', { groupId: group.id, groupName: group.name, groupIcon: group.icon });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>👥 Groups</Text>
          <Text style={styles.headerSub}>Connect with your campus community</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GroupCard group={item} onJoin={handleJoin} onOpen={handleOpen} />}
          ListEmptyComponent={<Text style={styles.empty}>No groups yet. Create the first one! 🎉</Text>}
        />
      )}

      <CreateGroupModal visible={createVisible} onClose={() => setCreateVisible(false)} onCreate={handleCreate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  createBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  list: { paddingHorizontal: 14, paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});