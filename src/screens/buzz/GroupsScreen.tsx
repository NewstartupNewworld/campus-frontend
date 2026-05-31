import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupType = 'topic' | 'event' | 'interest';

interface Group {
  id: string;
  type: GroupType;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  messageCount: number;
  lastMessage: string;
  lastMessageTime: string;
  isActive: boolean;      // true if 5+ members
  isMember: boolean;
  createdBy: string;      // anonymous handle
  // Event-specific
  eventDate?: string;
  eventLocation?: string;
  attendeeCount?: number;
  // Topic-specific
  isPinned?: boolean;
}

interface Message {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  reactions: { emoji: string; count: number }[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GROUPS: Group[] = [
  {
    id: '1', type: 'topic', name: '#wifi-issues',
    description: 'Report and discuss campus WiFi problems',
    icon: '📶', memberCount: 142, messageCount: 89,
    lastMessage: 'Library block still dead since morning 😤',
    lastMessageTime: '5m ago', isActive: true, isMember: true,
    createdBy: 'CampusOwl#42', isPinned: true,
  },
  {
    id: '2', type: 'event', name: 'Hackathon 2026',
    description: '24-hour hackathon. ₹50k prize pool. Teams of 2-4.',
    icon: '🚀', memberCount: 67, messageCount: 234,
    lastMessage: 'Anyone looking for a React Native dev for their team?',
    lastMessageTime: '12m ago', isActive: true, isMember: false,
    createdBy: 'SwiftFox#11',
    eventDate: 'Sat 31 May, 9:00 AM',
    eventLocation: 'Main Auditorium',
    attendeeCount: 67,
  },
  {
    id: '3', type: 'interest', name: 'Guitar & Music',
    description: 'For students who play or love music',
    icon: '🎸', memberCount: 28, messageCount: 45,
    lastMessage: 'Jam session at C hostel common room tonight 8pm!',
    lastMessageTime: '1h ago', isActive: true, isMember: true,
    createdBy: 'NightOwl#77',
  },
  {
    id: '4', type: 'topic', name: '#placements-2026',
    description: 'Placement news, tips, and company updates',
    icon: '💼', memberCount: 312, messageCount: 567,
    lastMessage: 'Google opened applications for SWE intern!',
    lastMessageTime: '2h ago', isActive: true, isMember: false,
    createdBy: 'GhostCoder#99', isPinned: true,
  },
  {
    id: '5', type: 'interest', name: 'Competitive Programming',
    description: 'LeetCode, Codeforces, CP discussions',
    icon: '🏆', memberCount: 3, messageCount: 0,
    lastMessage: 'Waiting for 2 more members to activate...',
    lastMessageTime: '', isActive: false, isMember: true,
    createdBy: 'SilentWolf#55',
  },
  {
    id: '6', type: 'event', name: 'Freshers Night 2026',
    description: 'Annual freshers welcome party. All welcome!',
    icon: '🎉', memberCount: 189, messageCount: 312,
    lastMessage: 'Dress code confirmed: semi-formal',
    lastMessageTime: '3h ago', isActive: true, isMember: false,
    createdBy: 'WildEagle#33',
    eventDate: 'Fri 30 May, 7:00 PM',
    eventLocation: 'Open Air Theatre',
    attendeeCount: 189,
  },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', author: 'NightOwl#77', text: 'Library block still dead since morning 😤', createdAt: new Date(Date.now() - 300000).toISOString(), reactions: [{ emoji: '😤', count: 12 }, { emoji: '💀', count: 8 }] },
  { id: '2', author: 'GhostCoder#99', text: 'Filed a complaint 3 times. Nothing happens lol', createdAt: new Date(Date.now() - 240000).toISOString(), reactions: [{ emoji: '😂', count: 5 }] },
  { id: '3', author: 'SwiftFox#11', text: 'Use mobile hotspot for now. Jio works best in campus', createdAt: new Date(Date.now() - 180000).toISOString(), reactions: [{ emoji: '🙏', count: 20 }] },
  { id: '4', author: 'CampusOwl#42', text: 'Any updates from admin?', createdAt: new Date(Date.now() - 60000).toISOString(), reactions: [] },
];

const TOPIC_SUGGESTIONS = ['#free-food', '#lost-found', '#study-tips', '#hostel-life', '#internships', '#sports', '#exams', '#events'];

const timeAgo = (iso: string) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const typeColor = (type: GroupType) =>
  type === 'topic' ? Colors.accent : type === 'event' ? Colors.warn : Colors.success;

const typeLabel = (type: GroupType) =>
  type === 'topic' ? 'Topic Room' : type === 'event' ? 'Event' : 'Interest Group';

// ─── Group Card ───────────────────────────────────────────────────────────────

const GroupCard = ({ group, onPress, onJoin }: {
  group: Group;
  onPress: (g: Group) => void;
  onJoin: (g: Group) => void;
}) => {
  const color = typeColor(group.type);
  return (
    <TouchableOpacity
      style={[styles.groupCard, !group.isActive && styles.groupCardInactive]}
      onPress={() => group.isActive && onPress(group)}
      activeOpacity={0.8}
    >
      <View style={styles.groupLeft}>
        <View style={[styles.groupIcon, { backgroundColor: color + '22' }]}>
          <Text style={styles.groupIconText}>{group.icon}</Text>
        </View>
        {group.isPinned && (
          <View style={styles.pinnedDot}>
            <Text style={{ fontSize: 8 }}>📌</Text>
          </View>
        )}
      </View>

      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.typeText, { color }]}>{typeLabel(group.type)}</Text>
          </View>
        </View>

        {!group.isActive ? (
          <View style={styles.pendingWrap}>
            <Text style={styles.pendingText}>
              ⏳ {group.memberCount}/5 members — needs {5 - group.memberCount} more to activate
            </Text>
            <View style={styles.pendingBar}>
              <View style={[styles.pendingFill, { width: `${(group.memberCount / 5) * 100}%` as any }]} />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.groupLast} numberOfLines={1}>{group.lastMessage}</Text>
            <View style={styles.groupFooter}>
              <Text style={styles.groupMeta}>👥 {group.memberCount} • 💬 {group.messageCount}</Text>
              <Text style={styles.groupTime}>{group.lastMessageTime}</Text>
            </View>
          </>
        )}

        {group.type === 'event' && group.eventDate && (
          <View style={styles.eventInfo}>
            <Text style={styles.eventText}>📅 {group.eventDate}</Text>
            <Text style={styles.eventText}>📍 {group.eventLocation}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.joinBtn, group.isMember && styles.joinBtnMember, { borderColor: color }]}
        onPress={() => onJoin(group)}
      >
        <Text style={[styles.joinBtnText, { color: group.isMember ? Colors.textMuted : color }]}>
          {group.isMember ? '✓ Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── Chat Room ────────────────────────────────────────────────────────────────

const ChatRoom = ({ group, onBack }: { group: Group; onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      author: 'CampusOwl#42',
      text: input.trim(),
      createdAt: new Date().toISOString(),
      reactions: [],
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderIcon}>
          <Text style={{ fontSize: 20 }}>{group.icon}</Text>
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{group.name}</Text>
          <Text style={styles.chatHeaderMeta}>👥 {group.memberCount} members</Text>
        </View>
        {group.type === 'event' && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>📅 {group.eventDate}</Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.author === 'CampusOwl#42' && styles.msgRowOwn]}>
            {item.author !== 'CampusOwl#42' && (
              <View style={styles.msgAvatar}>
                <Text style={{ fontSize: 12 }}>👤</Text>
              </View>
            )}
            <View style={styles.msgContent}>
              {item.author !== 'CampusOwl#42' && (
                <Text style={styles.msgAuthor}>{item.author}</Text>
              )}
              <View style={[styles.msgBubble, item.author === 'CampusOwl#42' && styles.msgBubbleOwn]}>
                <Text style={[styles.msgText, item.author === 'CampusOwl#42' && styles.msgTextOwn]}>
                  {item.text}
                </Text>
              </View>
              {item.reactions.length > 0 && (
                <View style={styles.reactionsRow}>
                  {item.reactions.map(r => (
                    <TouchableOpacity
                      key={r.emoji}
                      style={styles.reactionPill}
                      onPress={() => handleReact(item.id, r.emoji)}
                    >
                      <Text style={styles.reactionText}>{r.emoji} {r.count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.msgActions}>
                {['👍', '😂', '🔥', '❤️'].map(emoji => (
                  <TouchableOpacity key={emoji} onPress={() => handleReact(item.id, emoji)}>
                    <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.msgTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${group.name}...`}
            placeholderTextColor={Colors.textDim}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Create Group Modal ───────────────────────────────────────────────────────

const CreateGroupModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (group: Partial<Group>) => void;
}) => {
  const [type, setType] = useState<GroupType>('interest');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [icon, setIcon] = useState('💬');

  const ICONS = ['💬', '🎸', '🏆', '🎮', '📚', '🎉', '🍕', '🏃', '🎨', '🔬', '💼', '🌟'];

  const handleCreate = () => {
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter a group name.'); return; }
    if (!description.trim()) { Alert.alert('Missing description', 'Please add a description.'); return; }
    onCreate({
      type, name: type === 'topic' ? `#${name.toLowerCase().replace(/\s+/g, '-')}` : name,
      description, icon, eventDate, eventLocation,
      memberCount: 1, messageCount: 0,
      lastMessage: 'Group created! Invite 4 more members to activate.',
      lastMessageTime: 'just now',
      isActive: false, isMember: true,
      createdBy: 'CampusOwl#42',
    });
    setName(''); setDescription(''); setEventDate(''); setEventLocation(''); setIcon('💬');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cs.overlay}>
        <TouchableOpacity style={cs.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={cs.sheet} showsVerticalScrollIndicator={false}>
            <View style={cs.handle} />
            <Text style={cs.title}>Create Group</Text>

            {/* Type selector */}
            <Text style={cs.label}>Type</Text>
            <View style={cs.typeRow}>
              {(['topic', 'event', 'interest'] as GroupType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[cs.typeBtn, type === t && { backgroundColor: typeColor(t) + '22', borderColor: typeColor(t) + '66' }]}
                  onPress={() => setType(t)}
                >
                  <Text style={[cs.typeBtnText, type === t && { color: typeColor(t), fontWeight: '700' }]}>
                    {t === 'topic' ? '# Topic Room' : t === 'event' ? '📅 Event' : '⭐ Interest'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon picker */}
            <Text style={cs.label}>Icon</Text>
            <View style={cs.iconGrid}>
              {ICONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  style={[cs.iconBtn, icon === ic && cs.iconBtnActive]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={{ fontSize: 22 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Topic suggestions */}
            {type === 'topic' && (
              <>
                <Text style={cs.label}>Quick Topics</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {TOPIC_SUGGESTIONS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={cs.suggestionPill}
                      onPress={() => setName(t.replace('#', ''))}
                    >
                      <Text style={cs.suggestionText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={cs.label}>{type === 'topic' ? 'Topic Name (without #)' : 'Group Name'}</Text>
            <View style={cs.inputWrap}>
              {type === 'topic' && <Text style={cs.hashPrefix}>#</Text>}
              <TextInput
                style={cs.input}
                value={name}
                onChangeText={setName}
                placeholder={type === 'topic' ? 'wifi-issues' : type === 'event' ? 'Hackathon 2026' : 'Guitar & Music'}
                placeholderTextColor={Colors.textDim}
              />
            </View>

            <Text style={cs.label}>Description</Text>
            <TextInput
              style={[cs.input, { height: 80, textAlignVertical: 'top', padding: 12 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this group about?"
              placeholderTextColor={Colors.textDim}
              multiline
            />

            {type === 'event' && (
              <>
                <Text style={cs.label}>Event Date & Time</Text>
                <TextInput
                  style={cs.input}
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholder="e.g. Sat 31 May, 9:00 AM"
                  placeholderTextColor={Colors.textDim}
                />
                <Text style={cs.label}>Location</Text>
                <TextInput
                  style={cs.input}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder="e.g. Main Auditorium"
                  placeholderTextColor={Colors.textDim}
                />
              </>
            )}

            <View style={cs.infoBox}>
              <Text style={cs.infoText}>
                ℹ️ Your group needs 5 members to activate. Share it with classmates to get started!
              </Text>
            </View>

            <TouchableOpacity style={cs.createBtn} onPress={handleCreate}>
              <Text style={cs.createBtnText}>🚀 Create Group</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const cs = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%', borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 12, color: Colors.textMuted },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  suggestionPill: { backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  suggestionText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 4 },
  hashPrefix: { color: Colors.accent, fontSize: 16, fontWeight: '700', marginRight: 4 },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14 },
  infoBox: { backgroundColor: Colors.accent + '12', borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '33', padding: 12, marginTop: 14 },
  infoText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  createBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// ─── Main Groups Screen ───────────────────────────────────────────────────────

export const GroupsScreen = () => {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [activeFilter, setActiveFilter] = useState<'all' | GroupType>('all');
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [search, setSearch] = useState('');

  const handleJoin = (group: Group) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== group.id) return g;
      const newCount = g.isMember ? g.memberCount - 1 : g.memberCount + 1;
      return { ...g, isMember: !g.isMember, memberCount: newCount, isActive: newCount >= 5 };
    }));
  };

  const handleCreate = (newGroup: Partial<Group>) => {
    const g: Group = {
      id: Date.now().toString(),
      ...newGroup,
    } as Group;
    setGroups(prev => [g, ...prev]);
  };

  const filtered = groups.filter(g =>
    (activeFilter === 'all' || g.type === activeFilter) &&
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (activeGroup) {
    return <ChatRoom group={activeGroup} onBack={() => setActiveGroup(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSub}>{groups.filter(g => g.isMember).length} joined • {groups.length} total</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search groups..."
          placeholderTextColor={Colors.textDim}
        />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
        {(['all', 'topic', 'event', 'interest'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'topic' ? '# Topics' : f === 'event' ? '📅 Events' : '⭐ Interests'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Groups list */}
      <FlatList
        data={filtered}
        keyExtractor={g => g.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={setActiveGroup} onJoin={handleJoin} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No groups found. Create one! 🚀</Text>
        }
      />

      <CreateGroupModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  createBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 10 },
  filterRow: { flexGrow: 0, marginBottom: 8, paddingLeft: 16 },
  filterPill: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 6 },
  filterPillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },

  // Group card
  groupCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  groupCardInactive: { opacity: 0.7 },
  groupLeft: { position: 'relative' },
  groupIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupIconText: { fontSize: 22 },
  pinnedDot: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.card, borderRadius: 8, padding: 2 },
  groupContent: { flex: 1 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  groupName: { fontWeight: '800', fontSize: 14, color: Colors.text, flex: 1 },
  typeBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  groupLast: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  groupFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  groupMeta: { fontSize: 11, color: Colors.textDim },
  groupTime: { fontSize: 11, color: Colors.textDim },
  pendingWrap: { marginBottom: 4 },
  pendingText: { fontSize: 11, color: Colors.warn, marginBottom: 4 },
  pendingBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  pendingFill: { height: '100%', backgroundColor: Colors.warn, borderRadius: 2 },
  eventInfo: { flexDirection: 'row', gap: 12, marginTop: 4 },
  eventText: { fontSize: 11, color: Colors.warn },
  joinBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start' },
  joinBtnMember: { borderColor: Colors.border },
  joinBtnText: { fontSize: 12, fontWeight: '700' },

  // Chat room
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.text, fontSize: 22 },
  chatHeaderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontWeight: '800', fontSize: 15, color: Colors.text },
  chatHeaderMeta: { fontSize: 11, color: Colors.textMuted },
  eventBadge: { backgroundColor: Colors.warn + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.warn + '44' },
  eventBadgeText: { fontSize: 10, color: Colors.warn, fontWeight: '700' },
  messageList: { padding: 14, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  msgRowOwn: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  msgContent: { flex: 1, maxWidth: '80%' },
  msgAuthor: { fontSize: 11, fontWeight: '700', color: Colors.accent, marginBottom: 3 },
  msgBubble: { backgroundColor: Colors.card, borderRadius: 14, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border, padding: 10 },
  msgBubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4, borderBottomLeftRadius: 14, borderColor: 'transparent' },
  msgText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionPill: { backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 7, paddingVertical: 2 },
  reactionText: { fontSize: 12 },
  msgActions: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  msgTime: { fontSize: 10, color: Colors.textDim, marginLeft: 'auto' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
  chatInput: { flex: 1, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: Colors.accentDim },
  sendIcon: { color: '#fff', fontSize: 16 },
});
