import React from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    useColorScheme,
    ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useTradeFormStore } from '../../src/stores/trade-form.store'

const STRATEGIES = ['Breakout', 'Mean Reversion', 'Trend Following', 'Scalp', 'News Driven']
const SESSIONS = [
    { id: 'ASIAN', label: 'Asia', time: '00:00 - 06:00' },
    { id: 'LONDON', label: 'London', time: '07:00 - 15:00' },
    { id: 'NEW_YORK', label: 'NY Early', time: '12:00 - 16:00' },
    { id: 'NY_LATE', label: 'NY Late', time: '16:00 - 20:00' },
] // Note: Database expects standard enum, e.g., LONDON
const EMOTIONS = [
    { id: 'CALM', label: 'Focused', icon: 'sentiment-very-satisfied' },
    { id: 'CONFIDENT', label: 'Calm', icon: 'sentiment-satisfied' },
    { id: 'NEUTRAL', label: 'Neutral', icon: 'sentiment-neutral' },
    { id: 'ANXIOUS', label: 'Anxious', icon: 'sentiment-dissatisfied' },
    { id: 'FOMO', label: 'FOMO', icon: 'sentiment-very-dissatisfied' },
]

export default function NewTradeStep5() {
    const isDark = useColorScheme() === 'dark'
    const store = useTradeFormStore()

    const toggleStrategy = (strat: string) => {
        const current = store.strategyTags
        if (current.includes(strat)) {
            store.updateField('strategyTags', current.filter((s) => s !== strat))
        } else {
            store.updateField('strategyTags', [...current, strat])
        }
    }

    return (
        <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
            <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? 'rgba(17,33,23,0.8)' : 'rgba(246,248,247,0.8)' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? '#16a24e' : '#16a24e'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Classification</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.progressSection}>
                    <View style={styles.progressTop}>
                        <Text style={styles.stepLabel}>Step 5 of 6</Text>
                        <Text style={styles.stepCount}>83% Complete</Text>
                    </View>
                    <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
                        <View style={[styles.progressBarFill, { width: '83%' }]} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="label" size={20} color="#16a24e" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Strategy Tags</Text>
                    </View>
                    <View style={styles.wrapGrid}>
                        {STRATEGIES.map((s) => {
                            const active = store.strategyTags.includes(s)
                            return (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.tagBtn, active ? styles.tagActive : (isDark ? styles.tagDark : styles.tagLight)]}
                                    onPress={() => toggleStrategy(s)}
                                >
                                    <Text style={[styles.tagText, active ? { color: '#fff' } : (isDark ? { color: '#f8fafc' } : { color: '#0f172a' })]}>{s}</Text>
                                </TouchableOpacity>
                            )
                        })}
                        <TouchableOpacity style={styles.tagCustomBtn}>
                            <MaterialIcons name="add" size={16} color="#16a24e" />
                            <Text style={styles.tagCustomText}>Custom</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="schedule" size={20} color="#16a24e" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Trading Session</Text>
                    </View>
                    <View style={styles.sessionGrid}>
                        {SESSIONS.map((s) => {
                            const active = store.sessionFocus === s.id
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.sessionBtn, active ? styles.sessionActive : (isDark ? styles.sessionDark : styles.sessionLight)]}
                                    onPress={() => store.updateField('sessionFocus', s.id)}
                                >
                                    <Text style={[styles.sessionLabel, active ? { color: '#16a24e' } : { color: '#64748b' }]}>{s.label}</Text>
                                    <Text style={[styles.sessionTime, active ? { color: '#94a3b8' } : { color: '#94a3b8' }]}>{s.time}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="psychology" size={20} color="#16a24e" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Emotional State</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emotionScroll}>
                        {EMOTIONS.map((e) => {
                            const active = store.emotionalState === e.id
                            return (
                                <TouchableOpacity key={e.id} style={styles.emotionBtn} onPress={() => store.updateField('emotionalState', e.id)}>
                                    <View style={[styles.emotionCircle, active ? styles.emotionActive : styles.emotionInactive]}>
                                        <MaterialIcons name={e.icon as any} size={28} color={active ? '#16a24e' : '#94a3b8'} />
                                    </View>
                                    <Text style={[styles.emotionText, active ? { color: '#16a24e', fontWeight: 'bold' } : { color: '#94a3b8' }]}>{e.label}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                <View style={[styles.ratingSection, isDark ? styles.borderDark : styles.borderLight]}>
                    <Text style={styles.ratingTitle}>OVERALL TRADE RATING</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => store.updateField('rating', star)}>
                                <MaterialIcons name={store.rating >= star ? 'star' : 'star-outline'} size={40} color={store.rating >= star ? '#16a24e' : '#64748b'} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? '#112117' : '#f6f8f7' }]}>
                <TouchableOpacity style={[styles.btnOutline, isDark ? styles.borderDark : styles.borderLight]} onPress={() => router.back()}>
                    <Text style={[styles.btnOutlineText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/trade/step-6')}>
                    <Text style={styles.btnPrimaryText}>Final Step</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bgLight: { backgroundColor: '#f6f8f7' },
    bgDark: { backgroundColor: '#112117' },
    borderLight: { borderColor: 'rgba(22, 162, 78, 0.2)' },
    borderDark: { borderColor: 'rgba(22, 162, 78, 0.2)' },
    progressBgLight: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },
    progressBgDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },

    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 64 : 24, paddingBottom: 16, borderBottomWidth: 1, justifyContent: 'space-between', zIndex: 10 },
    iconBtn: { backgroundColor: 'rgba(22, 162, 78, 0.1)', padding: 8, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 40 },

    scrollContent: { padding: 24, paddingBottom: 120, gap: 32 },

    progressSection: { gap: 12 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    stepLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },
    stepCount: { fontSize: 14, fontWeight: '500', color: '#64748b' },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

    section: { gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },

    wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagBtn: { paddingHorizontal: 20, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    tagActive: { backgroundColor: '#16a24e', borderColor: '#16a24e' },
    tagLight: { backgroundColor: 'rgba(22, 162, 78, 0.1)', borderColor: 'rgba(22, 162, 78, 0.2)' },
    tagDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)', borderColor: 'rgba(22, 162, 78, 0.2)' },
    tagText: { fontSize: 14, fontWeight: '600' },

    tagCustomBtn: { paddingHorizontal: 16, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(22, 162, 78, 0.3)', flexDirection: 'row', gap: 4 },
    tagCustomText: { fontSize: 14, fontWeight: '600', color: '#16a24e' },

    sessionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    sessionBtn: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8, borderWidth: 1 },
    sessionActive: { borderColor: '#16a24e', backgroundColor: 'rgba(22, 162, 78, 0.2)', borderWidth: 2 },
    sessionLight: { borderColor: 'rgba(22, 162, 78, 0.2)', backgroundColor: 'rgba(22, 162, 78, 0.05)' },
    sessionDark: { borderColor: 'rgba(22, 162, 78, 0.2)', backgroundColor: 'rgba(22, 162, 78, 0.05)' },
    sessionLabel: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    sessionTime: { fontSize: 12 },

    emotionScroll: { gap: 12, paddingBottom: 8 },
    emotionBtn: { alignItems: 'center', gap: 8, width: 72 },
    emotionCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    emotionActive: { backgroundColor: 'rgba(22, 162, 78, 0.2)', borderColor: '#16a24e', borderWidth: 2 },
    emotionInactive: { backgroundColor: '#1e293b', borderColor: '#334155' },
    emotionText: { fontSize: 12, fontWeight: '500' },

    ratingSection: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, marginTop: 16, gap: 12 },
    ratingTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 2 },
    starsRow: { flexDirection: 'row', gap: 8 },

    footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 24, borderTopWidth: 1, gap: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    btnOutline: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
    btnOutlineText: { fontSize: 16, fontWeight: 'bold' },
    btnPrimary: { flex: 2, backgroundColor: '#16a24e', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, shadowColor: '#16a24e', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 },
    btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
})
